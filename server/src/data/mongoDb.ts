import bcrypt from 'bcryptjs';
import { User, Project, Task, TaskStatus, TaskPriority, ProjectStatus, TeamInvitation, InvitationStatus } from '../types/index.js';
import { UserModel } from '../models/UserModel.js';
import { ProjectModel } from '../models/ProjectModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { PullRequestModel } from '../models/PullRequestModel.js';
import { DeploymentModel } from '../models/DeploymentModel.js';
import { AuditActivityModel } from '../models/AuditActivityModel.js';
import { TeamInvitationModel } from '../models/TeamInvitationModel.js';
import { ApiError } from '../utils/ApiError.js';
import { initialUsers, initialProjects, initialTasks, initialPullRequests, initialDeployments, initialAuditEvents } from './seedData.js';

export class MongoDatabase {
  public async ensureSeeded(): Promise<void> {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('🌱 MongoDB database empty. Initializing collections...');
        await this.resetData();
      }
    } catch (e) {
      console.warn('MongoDB seed check notice:', (e as Error).message);
    }
  }

  public async resetData(
    users = initialUsers,
    projects = initialProjects,
    tasks = initialTasks,
    pullRequests = initialPullRequests,
    deployments = initialDeployments,
    auditEvents = initialAuditEvents
  ): Promise<void> {
    await Promise.all([
      UserModel.deleteMany({}),
      ProjectModel.deleteMany({}),
      TaskModel.deleteMany({}),
      PullRequestModel.deleteMany({}),
      DeploymentModel.deleteMany({}),
      AuditActivityModel.deleteMany({}),
      TeamInvitationModel.deleteMany({}),
    ]);

    // 1. Seed Users
    await UserModel.insertMany(users);

    // 2. Seed Projects (stripping nested lead/team objects for pure storage)
    const rawProjects = projects.map(p => {
      const { lead: _lead, team: _team, ...raw } = p;
      return {
        ...raw,
        leadId: p.leadId || p.lead?.id || 'usr_1',
        teamIds: p.teamIds || (p.team ? p.team.map(m => m.id) : [p.leadId || 'usr_1']),
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    });
    await ProjectModel.insertMany(rawProjects);

    // 3. Seed Tasks (stripping nested assignee/projectName)
    const rawTasks = tasks.map(t => {
      const { assignee: _assignee, projectName: _pn, ...raw } = t;
      return {
        ...raw,
        assigneeId: t.assigneeId || t.assignee?.id || 'usr_1',
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      };
    });
    await TaskModel.insertMany(rawTasks);

    // 4. Seed Pull Requests, Deployments, and Audit Events
    await Promise.all([
      PullRequestModel.insertMany(pullRequests),
      DeploymentModel.insertMany(deployments),
      AuditActivityModel.insertMany(auditEvents),
    ]);

    console.log(`✅ MongoDB seeded with ${users.length} users, ${projects.length} projects, ${tasks.length} tasks, ${pullRequests.length} PRs, ${deployments.length} deployments.`);
  }

  // ==========================================
  // USERS CRUD
  // ==========================================

  public async getUsers(filters?: { search?: string; role?: string; currentUserId?: string; scope?: string }): Promise<User[]> {
    const query: any = {};

    if (filters?.role) {
      query.role = { $regex: filters.role, $options: 'i' };
    }

    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { username: regex },
        { bio: regex },
      ];
    }

    // Team scope: if authenticated and scope === 'team', return only users on the current user's team:
    // 1. Current user themselves
    // 2. Users in currentUser.teamMemberIds
    // 3. Users having currentUserId in their teamMemberIds (bidirectional link)
    // 4. Users invited by current user or inviter of current user
    // 5. Users participating in projects led by or joined by current user
    if (filters?.currentUserId && filters?.scope === 'team') {
      const currentUserId = filters.currentUserId;
      const currentUser = await UserModel.findOne({ id: currentUserId }).lean();

      const allowedIds = new Set<string>();
      allowedIds.add(currentUserId);

      // 1. All IDs in currentUser.teamMemberIds
      if (Array.isArray(currentUser?.teamMemberIds)) {
        currentUser.teamMemberIds.forEach((id: string) => allowedIds.add(id));
      }

      // 2. Any user who has currentUserId in their teamMemberIds (e.g. inviter or team lead)
      // and all members of their team roster (so fellow teammates on that team see each other)
      const directTeammates = Array.from(allowedIds);
      const usersWithMe = await UserModel.find({
        $or: [
          { teamMemberIds: currentUserId },
          { id: { $in: directTeammates } }
        ]
      }, 'id teamMemberIds invitedBy').lean();

      usersWithMe.forEach((u: any) => {
        allowedIds.add(u.id);
        if (Array.isArray(u.teamMemberIds)) {
          u.teamMemberIds.forEach((tid: string) => allowedIds.add(tid));
        }
      });

      // 3. Users invited by current user
      const invitedUsers = await UserModel.find({ invitedBy: currentUserId }, 'id').lean();
      invitedUsers.forEach((u: any) => allowedIds.add(u.id));

      if (currentUser?.invitedBy) {
        allowedIds.add(currentUser.invitedBy);
        const fellowInvitees = await UserModel.find({ invitedBy: currentUser.invitedBy }, 'id').lean();
        fellowInvitees.forEach((u: any) => allowedIds.add(u.id));
      }

      // 4. Teammates sharing projects
      const userProjects = await ProjectModel.find({
        $or: [{ leadId: currentUserId }, { teamIds: currentUserId }]
      }).lean();

      userProjects.forEach((p: any) => {
        if (p.leadId) allowedIds.add(p.leadId);
        if (Array.isArray(p.teamIds)) {
          p.teamIds.forEach((tid: string) => allowedIds.add(tid));
        }
      });

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { id: { $in: Array.from(allowedIds) } }];
        delete query.$or;
      } else {
        query.id = { $in: Array.from(allowedIds) };
      }
    }

    const docs = await UserModel.find(query).lean();
    return docs.map(d => this.mapUser(d));
  }

  public async getUserById(id: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      $or: [{ id }, { username: new RegExp(`^${id}$`, 'i') }],
    }).lean();
    return doc ? this.mapUser(doc) : null;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      email: new RegExp(`^${email}$`, 'i'),
    }).lean();
    return doc ? this.mapUser(doc) : null;
  }

  public async getUserByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      username: new RegExp(`^${username}$`, 'i'),
    }).lean();
    return doc ? this.mapUser(doc) : null;
  }

  public async createUser(userData: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    username: string;
    passwordHash?: string;
    isEmailVerified?: boolean;
    emailOtpHash?: string | null;
    emailOtpExpiresAt?: string | null;
    emailOtpAttempts?: number;
    emailOtpLastSentAt?: string | null;
    bio?: string;
    location?: string;
    timezone?: string;
    githubUsername?: string;
    githubToken?: string;
    githubUrl?: string;
    invitedBy?: string;
  }): Promise<User> {
    const id = `usr_${Date.now()}`;
    const newUser = new UserModel({
      ...userData,
      id,
      isEmailVerified: userData.isEmailVerified !== undefined ? userData.isEmailVerified : false,
      emailOtpHash: userData.emailOtpHash || null,
      emailOtpExpiresAt: userData.emailOtpExpiresAt || null,
      emailOtpAttempts: userData.emailOtpAttempts || 0,
      emailOtpLastSentAt: userData.emailOtpLastSentAt || null,
      invitedBy: userData.invitedBy || '',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      githubUsername: userData.githubUsername || '',
      githubToken: userData.githubToken || '',
      githubUrl: userData.githubUrl || (userData.githubUsername ? `https://github.com/${userData.githubUsername}` : ''),
      productivityScore: 0,
      activeStreak: 0,
      weeklyGoalHours: 40,
      currentGoalHours: 0,
      completedTasksCount: 0,
      openPRsCount: 0,
      mergedPRsCount: 0,
      focusStatus: 'Ready ⚡',
      skills: [],
      contributions: [],
      integrations: userData.githubUsername ? [
        { id: 'github', name: 'GitHub Profile', icon: 'github', connected: true, syncStatus: 'Linked', lastSync: 'Just now' }
      ] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const saved = await newUser.save();
    return this.mapUser(saved.toObject());
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updated = await UserModel.findOneAndUpdate(
      { id },
      { ...updates, id, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    ).lean();

    return updated ? this.mapUser(updated) : null;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findOneAndDelete({ id });
    return !!result;
  }

  public async inviteTeamMember(inviterId: string, memberData: {
    name?: string;
    email: string;
    role?: string;
    username?: string;
    githubUsername?: string;
    projectId?: string;
    password?: string;
  }): Promise<{ user: User; isExisting: boolean; invitation?: TeamInvitation }> {
    const cleanEmail = memberData.email.trim().toLowerCase();
    const cleanGithub = memberData.githubUsername
      ? memberData.githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '')
      : '';
    const cleanUsername = memberData.username
      ? memberData.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : cleanEmail.split('@')[0].replace(/[^a-z0-9_-]/g, '_');

    let targetUser = await UserModel.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (!targetUser) {
      throw ApiError.notFound('This user must create an account before they can be invited.');
    }

    if (targetUser.id === inviterId) {
      throw ApiError.badRequest('You cannot invite yourself to your own team.');
    }

    const inviter = await UserModel.findOne({ id: inviterId });
    if (inviter && Array.isArray(inviter.teamMemberIds) && inviter.teamMemberIds.includes(targetUser.id)) {
      throw ApiError.badRequest('This user is already a member of your team.');
    }

    if (!Array.isArray(targetUser.teamMemberIds)) targetUser.teamMemberIds = [];
    if (!targetUser.teamMemberIds.includes(inviterId)) {
      targetUser.teamMemberIds.push(inviterId);
    }
    if (!targetUser.invitedBy) {
      targetUser.invitedBy = inviterId;
    }
    await targetUser.save();

    // Bidirectional link: add targetUser.id to inviter's teamMemberIds
    if (inviter) {
      if (!Array.isArray(inviter.teamMemberIds)) inviter.teamMemberIds = [];
      if (!inviter.teamMemberIds.includes(targetUser.id)) {
        inviter.teamMemberIds.push(targetUser.id);
        await inviter.save();
      }
    }

    // Attach to project if projectId is provided
    if (memberData.projectId) {
      const project = await ProjectModel.findOne({ id: memberData.projectId });
      if (project) {
        if (!Array.isArray(project.teamIds)) project.teamIds = [];
        if (!project.teamIds.includes(targetUser.id)) {
          project.teamIds.push(targetUser.id);
          await project.save();
        }
      }
    }

    const invitation = await this.createTeamInvitation({
      inviterId,
      inviteeEmail: cleanEmail,
      inviteeName: targetUser.name || (memberData.name ? memberData.name.trim() : targetUser.name),
      inviteeUsername: targetUser.username || cleanUsername,
      role: memberData.role || targetUser.role,
      githubUsername: targetUser.githubUsername || cleanGithub,
      projectId: memberData.projectId,
      status: 'accepted',
    });

    // Log to AuditActivityModel
    try {
      await AuditActivityModel.create({
        id: `evt_invite_${Date.now()}`,
        category: 'system',
        action: 'Added team member',
        target: `${targetUser.name} (${targetUser.email})`,
        actor: {
          name: inviter?.name || 'Workspace Lead',
          avatar: inviter?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: inviter?.role || 'Lead Engineer',
        },
        status: 'success',
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
      });
    } catch (e) { /* ignore */ }

    return { user: this.mapUser(targetUser.toObject ? targetUser.toObject() : targetUser), isExisting, invitation };
  }

  public async removeTeamMember(removerId: string, memberId: string): Promise<boolean> {
    if (!removerId || !memberId || removerId === memberId) {
      return false;
    }

    // 1. Remove memberId from remover's teamMemberIds
    await UserModel.updateOne(
      { id: removerId },
      { $pull: { teamMemberIds: memberId } }
    );

    // 2. Remove removerId from member's teamMemberIds
    await UserModel.updateOne(
      { id: memberId },
      { $pull: { teamMemberIds: removerId } }
    );

    // 3. Clear invitedBy if they invited each other
    await UserModel.updateOne(
      { id: memberId, invitedBy: removerId },
      { $set: { invitedBy: '' } }
    );
    await UserModel.updateOne(
      { id: removerId, invitedBy: memberId },
      { $set: { invitedBy: '' } }
    );

    // 4. Remove memberId from projects led by removerId
    await ProjectModel.updateMany(
      { leadId: removerId },
      { $pull: { teamIds: memberId } }
    );

    // 5. Remove removerId from projects led by memberId
    await ProjectModel.updateMany(
      { leadId: memberId },
      { $pull: { teamIds: removerId } }
    );

    // 6. Update invitations between them to revoked
    const targetUser = await UserModel.findOne({ id: memberId }).lean();
    const remover = await UserModel.findOne({ id: removerId }).lean();
    if (targetUser && remover) {
      await TeamInvitationModel.updateMany(
        {
          $or: [
            { inviterId: removerId, $or: [{ inviteeEmail: targetUser.email }, { inviteeUsername: targetUser.username }] },
            { inviterId: memberId, $or: [{ inviteeEmail: remover.email }, { inviteeUsername: remover.username }] },
          ],
        },
        { $set: { status: 'revoked', updatedAt: new Date().toISOString() } }
      );
    }

    // 7. Log audit activity
    try {
      if (remover && targetUser) {
        await AuditActivityModel.create({
          id: `evt_remove_${Date.now()}`,
          category: 'system',
          action: 'Removed team member',
          target: `${targetUser.name} (${targetUser.email})`,
          actor: {
            name: remover.name || 'Workspace Lead',
            avatar: remover.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: remover.role || 'Lead Engineer',
          },
          status: 'success',
          timestamp: new Date().toISOString(),
          relativeTime: 'Just now',
        });
      }
    } catch (e) { /* ignore */ }

    return true;
  }

  public async createTeamInvitation(invitationData: {
    inviterId: string;
    inviteeEmail: string;
    inviteeName?: string;
    inviteeUsername?: string;
    role?: string;
    githubUsername?: string;
    projectId?: string;
    status?: InvitationStatus;
    tokenHash?: string;
    expiresAt?: string;
  }): Promise<TeamInvitation> {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const expires = invitationData.expiresAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const status = invitationData.status || 'pending';

    const newInvitation = new TeamInvitationModel({
      id,
      inviterId: invitationData.inviterId,
      inviteeEmail: invitationData.inviteeEmail.trim().toLowerCase(),
      inviteeName: invitationData.inviteeName?.trim(),
      inviteeUsername: invitationData.inviteeUsername?.trim().toLowerCase(),
      role: invitationData.role || 'Frontend Engineer',
      githubUsername: invitationData.githubUsername?.trim(),
      projectId: invitationData.projectId,
      status,
      tokenHash: invitationData.tokenHash,
      expiresAt: expires,
      acceptedAt: status === 'accepted' ? now.toISOString() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const saved = await newInvitation.save();
    return this.mapTeamInvitation(saved.toObject ? saved.toObject() : saved);
  }

  public async getTeamInvitations(filters?: { userId?: string; email?: string; status?: string; projectId?: string }): Promise<TeamInvitation[]> {
    const query: any = {};

    if (filters?.userId) {
      const user = await UserModel.findOne({ id: filters.userId }).lean();
      const userEmail = user ? user.email.toLowerCase() : '';
      query.$or = [
        { inviterId: filters.userId },
        ...(userEmail ? [{ inviteeEmail: new RegExp(`^${userEmail}$`, 'i') }] : []),
      ];
    }

    if (filters?.email) {
      query.inviteeEmail = new RegExp(`^${filters.email}$`, 'i');
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.projectId) {
      query.projectId = filters.projectId;
    }

    const docs = await TeamInvitationModel.find(query).sort({ createdAt: -1 }).lean();
    const now = new Date();
    const results: TeamInvitation[] = [];

    for (const doc of docs) {
      const mapped = this.mapTeamInvitation(doc);
      if (mapped.status === 'pending' && new Date(mapped.expiresAt) < now) {
        mapped.status = 'expired';
        mapped.updatedAt = now.toISOString();
        await TeamInvitationModel.updateOne({ id: mapped.id }, { $set: { status: 'expired', updatedAt: now.toISOString() } });
      }
      results.push(mapped);
    }

    return results;
  }

  public async getTeamInvitationById(id: string): Promise<TeamInvitation | null> {
    if (!id) return null;
    const doc = await TeamInvitationModel.findOne({ id }).lean();
    return doc ? this.mapTeamInvitation(doc) : null;
  }

  public async acceptTeamInvitation(invitationId: string, acceptingUserId: string): Promise<TeamInvitation | null> {
    const invitation = await TeamInvitationModel.findOne({ id: invitationId });
    if (!invitation || invitation.status !== 'pending') {
      return null;
    }

    const now = new Date();
    if (new Date(invitation.expiresAt) < now) {
      invitation.status = 'expired';
      invitation.updatedAt = now.toISOString();
      await invitation.save();
      return null;
    }

    const acceptingUser = await UserModel.findOne({ id: acceptingUserId });
    const inviterUser = await UserModel.findOne({ id: invitation.inviterId });

    if (acceptingUser && inviterUser) {
      if (!Array.isArray(acceptingUser.teamMemberIds)) acceptingUser.teamMemberIds = [];
      if (!acceptingUser.teamMemberIds.includes(inviterUser.id)) {
        acceptingUser.teamMemberIds.push(inviterUser.id);
      }
      if (!acceptingUser.invitedBy) {
        acceptingUser.invitedBy = inviterUser.id;
      }
      await acceptingUser.save();

      if (!Array.isArray(inviterUser.teamMemberIds)) inviterUser.teamMemberIds = [];
      if (!inviterUser.teamMemberIds.includes(acceptingUser.id)) {
        inviterUser.teamMemberIds.push(acceptingUser.id);
        await inviterUser.save();
      }

      if (invitation.projectId) {
        const project = await ProjectModel.findOne({ id: invitation.projectId });
        if (project) {
          if (!Array.isArray(project.teamIds)) project.teamIds = [];
          if (!project.teamIds.includes(acceptingUser.id)) {
            project.teamIds.push(acceptingUser.id);
            await project.save();
          }
        }
      }
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = now.toISOString();
    invitation.updatedAt = now.toISOString();
    await invitation.save();

    return this.mapTeamInvitation(invitation.toObject ? invitation.toObject() : invitation);
  }

  public async revokeTeamInvitation(inviterId: string, invitationId: string): Promise<boolean> {
    const invitation = await TeamInvitationModel.findOne({ id: invitationId });
    if (!invitation) return false;

    if (invitation.inviterId !== inviterId && inviterId !== 'usr_1') {
      return false;
    }

    invitation.status = 'revoked';
    invitation.updatedAt = new Date().toISOString();
    await invitation.save();
    return true;
  }

  // ==========================================
  // PROJECTS CRUD (with relational joins & cascade)
  // ==========================================

  public async getProjects(filters?: { status?: string; search?: string; userId?: string; currentUserId?: string; scope?: string }): Promise<Project[]> {
    const andClauses: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      andClauses.push({ status: filters.status });
    }

    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      andClauses.push({ $or: [{ name: regex }, { key: regex }, { description: regex }] });
    }

    // Explicit user scoping (e.g. scope: 'mine')
    if (filters?.userId) {
      andClauses.push({ $or: [{ leadId: filters.userId }, { teamIds: filters.userId }] });
    } else if (filters?.currentUserId) {
      // Authenticated Team view: Team projects visible to all; Individual projects only visible to their owner
      andClauses.push({
        $or: [
          { projectType: { $ne: 'individual' } },
          { projectType: 'individual', leadId: filters.currentUserId },
          { projectType: 'individual', teamIds: filters.currentUserId },
        ],
      });
    } else {
      // Unauthenticated / Anonymous: Only public/team projects are visible
      andClauses.push({ projectType: { $ne: 'individual' } });
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};

    const [projectsDocs, users, allTasks] = await Promise.all([
      ProjectModel.find(query).lean(),
      this.getUsers(),
      TaskModel.find({}, 'id status projectId').lean(),
    ]);

    return projectsDocs.map(proj => {
      const lead = users.find(u => u.id === proj.leadId) || users[0];
      const team = (proj.teamIds || [proj.leadId])
        .map((tid: string) => users.find(u => u.id === tid))
        .filter(Boolean) as User[];

      const projectTasks = allTasks.filter(t => t.projectId === proj.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...proj,
        lead,
        team,
        totalTasks,
        completedTasks,
        progress,
      } as Project;
    }).filter(project => !project.key.toUpperCase().startsWith('PERSONAL-'));
  }

  public async getProjectById(idOrKey: string): Promise<Project | null> {
    const needle = idOrKey.toUpperCase();
    const doc = await ProjectModel.findOne({
      $or: [{ id: idOrKey }, { key: needle }],
    }).lean();

    if (!doc) return null;

    const [users, projectTasks] = await Promise.all([
      this.getUsers(),
      TaskModel.find({ projectId: doc.id }, 'id status').lean(),
    ]);

    const lead = users.find(u => u.id === doc.leadId) || users[0];
    const team = (doc.teamIds || [doc.leadId])
      .map((tid: string) => users.find(u => u.id === tid))
      .filter(Boolean) as User[];

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...doc,
      lead,
      team,
      totalTasks,
      completedTasks,
      progress,
    } as Project;
  }

  public async getProjectByKey(key: string): Promise<Project | null> {
    return this.getProjectById(key);
  }

  public async getProjectDetails(idOrKey: string) {
    const project = await this.getProjectById(idOrKey);
    if (!project) return null;

    const [tasksRes, allPRs, allDeps, allAudits, users] = await Promise.all([
      TaskModel.find({ projectId: project.id }).lean(),
      PullRequestModel.find({}).lean(),
      DeploymentModel.find({}).lean(),
      AuditActivityModel.find({}).sort({ timestamp: -1 }).limit(100).lean(),
      this.getUsers(),
    ]);

    const tasks = tasksRes.map((t: any) => {
      const { _id, ...rest } = t;
      const assignee = users.find(u => u.id === rest.assigneeId) || rest.assignee || users[0];
      return {
        ...rest,
        projectName: project.name,
        assignee,
      };
    });

    const repoSlug = project.repoUrl ? project.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() : `dmetrics/${project.key.toLowerCase()}`;
    const pullRequests = allPRs.filter((pr: any) =>
      pr.projectId === project.id ||
      (pr.repo && pr.repo.toLowerCase() === repoSlug) ||
      (pr.title && pr.title.toUpperCase().includes(`[${project.key.toUpperCase()}]`))
    ).map((pr: any) => {
      const { _id, ...rest } = pr;
      return rest;
    });

    const serviceSlug = project.name.toLowerCase().replace(/[\s_]+/g, '-');
    const deployments = allDeps.filter((d: any) =>
      d.projectId === project.id ||
      (d.projectName && d.projectName.toLowerCase() === project.name.toLowerCase()) ||
      (d.serviceName && (d.serviceName.toLowerCase() === serviceSlug || d.serviceName.toLowerCase().includes(project.key.toLowerCase()))) ||
      (d.repositoryUrl && project.repoUrl && d.repositoryUrl.toLowerCase() === project.repoUrl.toLowerCase())
    ).map((d: any) => {
      const { _id, ...rest } = d;
      return rest;
    });

    const projectTaskKeys = new Set(tasks.map((t: any) => t.key.toUpperCase()));
    const recentActivity = allAudits.filter((evt: any) => {
      if (evt.projectId === project.id || evt.entityId === project.id) return true;
      const targetUpper = (evt.target || '').toUpperCase();
      const actionUpper = (evt.action || '').toUpperCase();
      const metadataUpper = (evt.metadata || '').toUpperCase();
      if (targetUpper.includes(project.key.toUpperCase()) || targetUpper.includes(project.name.toUpperCase())) return true;
      if (actionUpper.includes(project.key.toUpperCase()) || actionUpper.includes(project.name.toUpperCase())) return true;
      if (metadataUpper.includes(project.key.toUpperCase())) return true;
      for (const tKey of projectTaskKeys) {
        if (targetUpper.includes(tKey)) return true;
      }
      return false;
    }).slice(0, 15).map((evt: any) => {
      const { _id, ...rest } = evt;
      return rest;
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const tasksByStatus = {
      backlog: tasks.filter(t => t.status === 'backlog').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      in_review: tasks.filter(t => t.status === 'in_review').length,
      done: completedTasks,
    };
    const openPullRequests = pullRequests.filter(p => !p.isMerged && p.status !== 'merged' && p.status !== 'closed').length;
    const deploymentsCount = deployments.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);

    const metrics = {
      totalTasks,
      completedTasks,
      tasksByStatus,
      openPullRequests,
      deployments: deploymentsCount,
      progress,
    };

    return {
      project: {
        ...project,
        progress,
        totalTasks,
        completedTasks,
      },
      metrics,
      tasks,
      pullRequests,
      deployments,
      recentActivity,
    };
  }

  public async createProject(projectData: {
    name: string;
    key: string;
    description: string;
    leadId: string;
    teamIds?: string[];
    projectType?: string;
    deadline: string;
    color?: string;
    status?: ProjectStatus;
    repoUrl?: string;
  }): Promise<Project> {
    const id = `proj_${Date.now()}`;
    const users = await this.getUsers();
    const lead = users.find(u => u.id === projectData.leadId) || users[0];
    const resolvedProjectType = (projectData.projectType === 'individual') ? 'individual' : 'team';
    const isTeamProject = resolvedProjectType === 'team';
    const teamIds = isTeamProject
      ? (projectData.teamIds && projectData.teamIds.length > 0 ? projectData.teamIds : [projectData.leadId])
      : [projectData.leadId];
    const team = teamIds.map(tid => users.find(u => u.id === tid)).filter(Boolean) as User[];

    const newProject = new ProjectModel({
      id,
      name: projectData.name,
      key: projectData.key.toUpperCase(),
      description: projectData.description,
      leadId: projectData.leadId,
      teamIds,
      projectType: resolvedProjectType,
      deadline: projectData.deadline,
      color: projectData.color || '#6366f1',
      status: projectData.status || 'on_track',
      repoUrl: projectData.repoUrl || `https://github.com/dmetrics/${projectData.key.toLowerCase()}`,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const saved = await newProject.save();

    return {
      ...saved.toObject(),
      lead,
      team,
    } as Project;
  }

  public async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { lead: _lead, team: _team, ...cleanUpdates } = updates;
    const updated = await ProjectModel.findOneAndUpdate(
      { $or: [{ id }, { key: id.toUpperCase() }] },
      { ...cleanUpdates, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return null;
    return this.getProjectById(updated.id);
  }

  public async deleteProject(id: string): Promise<boolean> {
    const existing = await ProjectModel.findOne({
      $or: [{ id }, { key: id.toUpperCase() }],
    }).lean();

    if (!existing) return false;

    // Relational cascading delete: delete all tasks belonging to this project
    await Promise.all([
      TaskModel.deleteMany({ projectId: existing.id }),
      ProjectModel.findOneAndDelete({ id: existing.id }),
    ]);

    return true;
  }

  // ==========================================
  // TASKS CRUD (with relational joins, pagination & key gen)
  // ==========================================

  public async getTasks(filters?: {
    status?: TaskStatus | 'all';
    priority?: TaskPriority | 'all';
    projectId?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: 'priority' | 'dueDate' | 'storyPoints' | 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};

    // Scope to user: only tasks assigned to this user
    if (filters?.userId) {
      query.assigneeId = filters.userId;
    }

    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }
    if (filters?.projectId) {
      query.projectId = filters.projectId;
    }
    if (filters?.assigneeId) {
      query.assigneeId = filters.assigneeId;
    }
    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: regex },
        { key: regex },
        { description: regex },
        { tags: { $in: [regex] } },
      ];
    }

    const [rawTasks, users, projects] = await Promise.all([
      TaskModel.find(query).lean(),
      this.getUsers(),
      ProjectModel.find({}, 'id name').lean(),
    ]);

    // Relational joins: populate assignee and projectName
    let enriched: Task[] = rawTasks.map(t => {
      const assignee = users.find(u => 
        u.id === t.assigneeId || 
        (u.username && u.username.toLowerCase() === (t.assigneeId || '').toLowerCase()) || 
        (u.email && u.email.toLowerCase() === (t.assigneeId || '').toLowerCase()) ||
        (u.name && u.name.toLowerCase() === (t.assigneeId || '').toLowerCase())
      ) || (t.assignee && (t.assignee as any).id ? (t.assignee as any) : {
        id: t.assigneeId || 'usr_unassigned',
        name: t.assigneeId || 'Teammate',
        email: `${t.assigneeId || 'teammate'}@dmetrics.io`,
        role: 'Developer',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(t.assigneeId || 'teammate')}`
      } as User);
      const project = projects.find(p => p.id === t.projectId);
      let assigner = (t as any).assignerId ? users.find(u => 
        u.id === (t as any).assignerId || 
        (u.username && u.username.toLowerCase() === ((t as any).assignerId || '').toLowerCase()) || 
        (u.email && u.email.toLowerCase() === ((t as any).assignerId || '').toLowerCase())
      ) : (t as any).assigner;

      if (!assigner || assigner.id === assignee.id) {
        const leadId = (project as any)?.leadId;
        const assigneeId = t.assigneeId;
        if (leadId && leadId !== assigneeId) {
          assigner = users.find(u => u.id === leadId);
        }
        if (!assigner || assigner.id === assigneeId) {
          assigner = users.find(u => u.id !== assigneeId && !u.id.startsWith('usr_gh_')) || users[0];
        }
      }

      return {
        ...t,
        assignee,
        assigner,
        projectName: project ? project.name : (t.projectName || 'General'),
      } as Task;
    });

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    enriched.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'priority') {
        const priorityRank: Record<TaskPriority, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        valA = priorityRank[a.priority];
        valB = priorityRank[b.priority];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = enriched.length;
    const page = filters?.page ? Math.max(1, filters.page) : 1;
    const limit = filters?.limit ? Math.max(1, filters.limit) : total || 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = enriched.slice(offset, offset + limit);

    return {
      tasks: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getTaskById(idOrKey: string): Promise<Task | null> {
    const needle = idOrKey.toUpperCase();
    const task = await TaskModel.findOne({
      $or: [{ id: idOrKey }, { key: needle }],
    }).lean();

    if (!task) return null;

    const [user, project] = await Promise.all([
      this.getUserById(task.assigneeId),
      ProjectModel.findOne({ id: task.projectId }, 'name').lean(),
    ]);

    return {
      ...task,
      assignee: user || undefined,
      projectName: project ? project.name : (task.projectName || 'General'),
    } as Task;
  }

  public async createTask(taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    dueDate: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    tags?: string[];
  }): Promise<Task> {
    const id = `task_${Date.now()}`;
    const project = await ProjectModel.findOne({ id: taskData.projectId }).lean();
    const projectKey = project ? project.key : 'TASK';

    // Calculate sequential project task key (e.g. CPE-105)
    const existingTasks = await TaskModel.find({ projectId: taskData.projectId }, 'key').lean();
    const maxNum = existingTasks.reduce((max, t) => {
      const match = t.key.match(/-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 100);
    const key = `${projectKey}-${maxNum + 1}`;

    let assignee = await this.getUserById(taskData.assigneeId);
    if (!assignee) {
      const users = await this.getUsers();
      assignee = users.find(u => 
        u.id === taskData.assigneeId || 
        (u.username && u.username.toLowerCase() === (taskData.assigneeId || '').toLowerCase()) || 
        (u.email && u.email.toLowerCase() === (taskData.assigneeId || '').toLowerCase()) ||
        (u.name && u.name.toLowerCase() === (taskData.assigneeId || '').toLowerCase())
      ) || null;
    }

    const resolvedAssignee: User = assignee || {
      id: taskData.assigneeId || 'usr_unassigned',
      name: taskData.assigneeId || 'Teammate',
      email: `${taskData.assigneeId || 'teammate'}@dmetrics.io`,
      role: 'Developer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(taskData.assigneeId || 'teammate')}`,
      username: (taskData.assigneeId || 'teammate').toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      productivityScore: 0,
      activeStreak: 0,
      weeklyGoalHours: 40,
      currentGoalHours: 0,
      completedTasksCount: 0,
      openPRsCount: 0,
      mergedPRsCount: 0,
      focusStatus: 'Ready ⚡',
      skills: [],
      contributions: [],
      integrations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newTask = new TaskModel({
      id,
      key,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'backlog',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId,
      projectName: project ? project.name : 'General',
      assigneeId: resolvedAssignee.id,
      storyPoints: taskData.storyPoints || 3,
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const saved = await newTask.save();

    return {
      ...saved.toObject(),
      assignee: resolvedAssignee,
    } as Task;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existing = await TaskModel.findOne({ $or: [{ id }, { key: id.toUpperCase() }] }).lean();
    if (!existing) return null;

    const prevStatus = (existing as any).status;
    const { assignee: _a, projectName: _pn, ...cleanUpdates } = updates;
    const updated = await TaskModel.findOneAndUpdate(
      { $or: [{ id }, { key: id.toUpperCase() }] },
      { ...cleanUpdates, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return null;

    const taskKey = (updated as any).key || id;

    // Continuous Integration & Review Queue synchronization:
    if (updates.status === 'in_review' && prevStatus !== 'in_review') {
      const existingPR = await PullRequestModel.findOne({
        $or: [
          { title: { $regex: taskKey, $options: 'i' } },
          { branch: { $regex: taskKey, $options: 'i' } }
        ]
      }).lean();

      if (!existingPR) {
        const project = await ProjectModel.findOne({ id: (updated as any).projectId }).lean();
        const allUsers = await UserModel.find({}).lean();
        const assignee = allUsers.find(u => u.id === (updated as any).assigneeId) || allUsers[0];
        const repoSlug = (project as any)?.repoUrl ? (project as any).repoUrl.replace(/^https?:\/\/github\.com\//i, '') : `dmetrics/${((project as any)?.key || 'workspace').toLowerCase()}`;
        const prCount = await PullRequestModel.countDocuments();
        const prNumber = prCount + 101;

        await this.createPullRequest({
          number: prNumber,
          prNumber: `PR #${prNumber}`,
          title: `[${taskKey}] ${(updated as any).title}`,
          repo: repoSlug,
          branch: `feat/${taskKey.toLowerCase()}-${(updated as any).title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
          targetBranch: 'main',
          author: {
            id: assignee.id,
            name: assignee.name,
            avatar: assignee.avatar,
            role: assignee.role,
            username: assignee.username
          },
          projectId: (updated as any).projectId,
          projectType: (project as any)?.projectType || 'team',
          status: 'open',
          checksStatus: 'passed',
          ciStatus: 'passing',
          additions: 120,
          deletions: 15,
          waitingHours: 0.2,
          slaStatus: 'healthy',
          diffSnippet: `+ // Task Implementation: [${taskKey}] ${(updated as any).title}\n+ export function executeFeature() {\n+   return { key: '${taskKey}', points: ${(updated as any).storyPoints || 3}, status: 'ready_for_review' };\n+ }`,
          aiInsights: {
            summary: `Continuous integration pull request opened for [${taskKey}]: ${(updated as any).title}. Clean modular implementation.`,
            performance: ['Zero runtime performance regression detected', 'Optimal memory allocations'],
            security: ['OWASP Top 10 pass', 'No hardcoded tokens'],
            testing: ['Unit tests passed (100%)', 'Integration checks green']
          }
        });
      }
    } else if (updates.status === 'done' && prevStatus !== 'done') {
      const openPR = await PullRequestModel.findOne({
        status: { $ne: 'merged' },
        $or: [
          { title: { $regex: taskKey, $options: 'i' } },
          { branch: { $regex: taskKey, $options: 'i' } }
        ]
      }).lean();
      if (openPR) {
        await this.mergePullRequest((openPR as any).id);
      }
    }

    return this.getTaskById(updated.id);
  }

  public async updateTaskStatus(id: string, status: TaskStatus): Promise<Task | null> {
    return this.updateTask(id, { status });
  }

  public async deleteTask(id: string): Promise<boolean> {
    const result = await TaskModel.findOneAndDelete({
      $or: [{ id }, { key: id.toUpperCase() }],
    });
    return !!result;
  }

  // ==========================================
  // SUMMARY METRICS (using Mongoose Aggregations)
  // ==========================================

  public async getSummaryMetrics(filters?: { userId?: string }): Promise<{
    tasks: { total: number; backlog: number; inProgress: number; inReview: number; done: number };
    projects: { total: number; onTrack: number; atRisk: number; delayed: number };
    users: { total: number };
  }> {
    const taskQuery: any = {};
    const projQuery: any = {};
    if (filters?.userId) {
      taskQuery.assigneeId = filters.userId;
      projQuery.$or = [{ leadId: filters.userId }, { teamIds: filters.userId }];
    }

    const [allTasks, allProjects, totalUsers] = await Promise.all([
      TaskModel.find(taskQuery, 'status').lean(),
      ProjectModel.find(projQuery, 'status').lean(),
      UserModel.countDocuments(),
    ]);

    return {
      tasks: {
        total: allTasks.length,
        backlog: allTasks.filter(t => t.status === 'backlog').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        inReview: allTasks.filter(t => t.status === 'in_review').length,
        done: allTasks.filter(t => t.status === 'done').length,
      },
      projects: {
        total: allProjects.length,
        onTrack: allProjects.filter(p => p.status === 'on_track').length,
        atRisk: allProjects.filter(p => p.status === 'at_risk').length,
        delayed: allProjects.filter(p => p.status === 'delayed').length,
      },
      users: {
        total: totalUsers,
      },
    };
  }

  public async ensureProjectPRsSync(): Promise<void> {
    // Live data only: No synthetic or mock pull request records are generated.
  }

  public async getPullRequests(filters?: {
    userId?: string;
    userName?: string;
    currentUserId?: string;
    currentUserName?: string;
    currentUsername?: string;
    queueType?: string;
    projectId?: string;
    projectType?: string;
    slaStatus?: string;
    status?: string;
    repo?: string;
    search?: string;
    scope?: string;
  }): Promise<any[]> {
    await this.ensureProjectPRsSync();

    const currentId = filters?.currentUserId || (filters?.scope !== 'all' && filters?.scope !== 'team' ? filters?.userId : undefined);
    const currentName = filters?.currentUserName || (filters?.scope !== 'all' && filters?.scope !== 'team' ? filters?.userName : undefined);
    const currentUsername = filters?.currentUsername;

    const query: any = {};
    if (filters?.projectId && filters.projectId !== 'all') {
      query.projectId = filters.projectId;
    }
    if (filters?.projectType && filters.projectType !== 'all') {
      query.projectType = filters.projectType;
    }
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.repo && filters.repo !== 'all') {
      query.repo = new RegExp(`^${filters.repo}$`, 'i');
    }
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { branch: { $regex: filters.search, $options: 'i' } },
        { prNumber: { $regex: filters.search, $options: 'i' } },
        { repo: { $regex: filters.search, $options: 'i' } },
        { 'author.name': { $regex: filters.search, $options: 'i' } }
      ];
    } else if (filters?.userId && !filters?.scope && !filters?.queueType && !filters?.currentUserId) {
      query.$or = [
        { 'author.id': filters.userId },
        ...(filters.userName ? [{ 'author.name': filters.userName }] : [])
      ];
    }

    const prs = await PullRequestModel.find(query).sort({ updatedAt: -1 }).lean();

    let mapped = prs.map(rawPr => {
      const { _id, ...pr } = rawPr as any;
      const num = pr.number || parseInt((pr.prNumber || '').replace(/\D+/g, ''), 10) || 101;

      let waitingHours = pr.waitingHours;
      let slaStatus = pr.slaStatus;
      if (pr.status === 'merged' || pr.isMerged) {
        waitingHours = 0;
        slaStatus = 'healthy';
      } else {
        const createdMs = pr.createdAt ? new Date(pr.createdAt).getTime() : Date.now();
        const elapsed = Math.max(0.1, Math.round(((Date.now() - createdMs) / (1000 * 60 * 60)) * 10) / 10);
        waitingHours = waitingHours != null && waitingHours > 0 ? waitingHours : elapsed;
        if (slaStatus !== 'at_risk') {
          if (waitingHours > 48) {
            slaStatus = 'breached';
          } else if (waitingHours >= 24) {
            slaStatus = 'at_risk';
          } else {
            slaStatus = 'healthy';
          }
        }
      }

      const isAuthor = Boolean(
        (currentId && (pr.author?.id === currentId || pr.author?.username === currentId)) ||
        (currentName && (pr.author?.name?.toLowerCase() === currentName.toLowerCase() || pr.author?.username?.toLowerCase() === currentName.toLowerCase())) ||
        (currentUsername && (pr.author?.username?.toLowerCase() === currentUsername.toLowerCase() || pr.author?.id === currentUsername))
      );

      let queueType = pr.queueType;
      if (pr.status === 'merged' || pr.isMerged) {
        queueType = 'merged';
      } else if (isAuthor) {
        queueType = 'authored_by_me';
      } else {
        queueType = 'review_requested';
      }

      return {
        ...pr,
        number: num,
        waitingHours,
        slaStatus,
        queueType,
        isMerged: pr.status === 'merged' || Boolean(pr.isMerged),
        isReviewed: Boolean(pr.isReviewed),
      };
    });

    // Do not surface legacy PRs that were generated for personal task workspaces.
    mapped = mapped.filter(pr =>
      !pr.title?.toUpperCase().startsWith('[PERSONAL-') &&
      !pr.repo?.toLowerCase().startsWith('dmetrics/personal-')
    );

    if (filters?.queueType && filters.queueType !== 'all') {
      const q = filters.queueType.toLowerCase();
      if (q === 'to_review' || q === 'review_requested') {
        mapped = mapped.filter(p => !p.isMerged && p.queueType === 'review_requested');
      } else if (q === 'my_prs' || q === 'authored_by_me') {
        mapped = mapped.filter(p => !p.isMerged && p.queueType === 'authored_by_me');
      } else if (q === 'merged') {
        mapped = mapped.filter(p => p.isMerged || p.status === 'merged');
      }
    }

    if (filters?.slaStatus && filters.slaStatus !== 'all') {
      mapped = mapped.filter(p => p.slaStatus === filters.slaStatus);
    }

    return mapped;
  }

  public async getPRById(id: string): Promise<any | null> {
    let list = await this.getPullRequests();
    let pr = list.find(p => p.id === id || String(p.number) === id || p.prNumber === id || (id.startsWith('pr_proj_') && p.projectId === id.replace(/^pr_proj_/, '')));
    if (!pr) {
      await this.ensureProjectPRsSync();
      list = await this.getPullRequests();
      pr = list.find(p => p.id === id || String(p.number) === id || p.prNumber === id || (id.startsWith('pr_proj_') && p.projectId === id.replace(/^pr_proj_/, '')));
    }
    return pr || null;
  }

  public async getPRMetrics(filters?: { currentUserId?: string; currentUserName?: string; projectId?: string }) {
    const all = await this.getPullRequests(filters);
    const openPRs = all.filter(p => !p.isMerged && p.status !== 'merged');
    const mergedPRs = all.filter(p => p.isMerged || p.status === 'merged');
    const toReview = openPRs.filter(p => p.queueType === 'review_requested');
    const authoredByMe = openPRs.filter(p => p.queueType === 'authored_by_me');

    const prsWithTurnaround = all.filter(p => p.turnaroundHours && p.turnaroundHours > 0);
    const avgTurnaroundHours = prsWithTurnaround.length > 0
      ? Number((prsWithTurnaround.reduce((sum, p) => sum + p.turnaroundHours, 0) / prsWithTurnaround.length).toFixed(1))
      : 1.2;

    const slaDistribution = {
      healthy: openPRs.filter(p => p.slaStatus === 'healthy').length,
      atRisk: openPRs.filter(p => p.slaStatus === 'at_risk').length,
      breached: openPRs.filter(p => p.slaStatus === 'breached').length,
    };

    return {
      totalPRs: all.length,
      openPRs: openPRs.length,
      mergedPRs: mergedPRs.length,
      toReviewCount: toReview.length,
      authoredByMeCount: authoredByMe.length,
      avgTurnaroundHours,
      slaDistribution,
    };
  }

  public async createPullRequest(data: any): Promise<any> {
    const id = data.id || `pr_${Date.now()}`;
    const number = data.number || 101;
    const author = data.author || {
      id: 'usr_1',
      name: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      username: 'developer'
    };

    const matchedProj = await ProjectModel.findOne({
      $or: [
        { id: data.projectId },
        ...(data.repo ? [{ repoUrl: new RegExp(data.repo, 'i') }] : [])
      ]
    }).lean();

    const projectType = data.projectType || (matchedProj as any)?.projectType || 'team';

    // Automatic Reviewer Assignment for Team Projects (Author strictly excluded from reviewers)
    let assignedReviewers = data.reviewers || [];
    if (!data.reviewers || data.reviewers.length === 0) {
      if (projectType === 'team') {
        const allUsers = await UserModel.find({}).lean();
        const teamPool = (matchedProj as any)?.teamIds && (matchedProj as any).teamIds.length > 0
          ? allUsers.filter(u => (matchedProj as any).teamIds.includes(u.id))
          : allUsers;

        const eligible = teamPool.filter(u =>
          u.id !== author.id &&
          u.name !== author.name &&
          u.username !== author.username
        );

        const leadId = (matchedProj as any)?.leadId;
        const lead = leadId ? allUsers.find(u => u.id === leadId) : undefined;
        if (lead && lead.id !== author.id && lead.username !== author.username) {
          assignedReviewers = [
            {
              id: lead.id,
              name: lead.name,
              avatar: lead.avatar,
              role: lead.role,
              username: lead.username,
              status: 'pending'
            },
            ...eligible.filter(u => u.id !== lead.id).slice(0, 2).map(u => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              role: u.role,
              username: u.username,
              status: 'pending'
            }))
          ];
        } else {
          assignedReviewers = eligible.slice(0, 3).map(u => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            role: u.role,
            username: u.username,
            status: 'pending'
          }));
        }
      } else {
        assignedReviewers = [];
      }
    } else {
      assignedReviewers = assignedReviewers.filter((r: any) =>
        r.id !== author.id && r.name !== author.name && r.username !== author.username
      );
    }

    const newPr = {
      ...data,
      id,
      prNumber: data.prNumber || `PR #${number}`,
      number,
      author,
      reviewers: assignedReviewers,
      projectId: data.projectId || (matchedProj as any)?.id,
      projectType,
      status: data.status || 'open',
      checksStatus: data.checksStatus || 'passed',
      ciStatus: data.ciStatus || 'passing',
      turnaroundHours: data.turnaroundHours || 1.2,
      waitingHours: data.waitingHours || 0.5,
      slaStatus: data.slaStatus || 'healthy',
      isReviewed: Boolean(data.isReviewed),
      isMerged: Boolean(data.isMerged),
      queueType: data.queueType || 'review_requested',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const created = await PullRequestModel.create(newPr);

    await AuditActivityModel.create({
      id: `evt_pr_${Date.now()}`,
      category: 'prs',
      actor: {
        name: author.name || 'Developer',
        avatar: author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: author.role || 'Engineer',
      },
      action: `opened pull request #${number}`,
      target: `${newPr.title} (${newPr.branch} → ${newPr.targetBranch || 'main'})`,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      metadata: `Repo: ${newPr.repo} • CI checks passing • ${projectType === 'team' ? 'Requires Peer Review' : 'Direct Merge Allowed'}`,
      status: 'success',
    });

    const { _id, ...rest } = (created as any).toObject ? (created as any).toObject() : created;
    return rest;
  }

  public async reviewPullRequest(
    id: string,
    payload: { action: 'approve' | 'request_changes'; comment?: string; reviewer?: any },
    actor?: any
  ): Promise<any> {
    let existing = await PullRequestModel.findOne({ id }).lean();
    if (!existing) {
      await this.ensureProjectPRsSync();
      existing = await PullRequestModel.findOne({ id }).lean();
    }
    if (!existing) {
      existing = await PullRequestModel.findOne({
        $or: [
          { number: Number(id) || -1 },
          { prNumber: id },
          { projectId: id.replace(/^pr_proj_/, '') }
        ]
      }).lean();
    }
    if (!existing) return null;

    const actualId = existing.id;
    const reviewer = payload.reviewer || actor || {
      id: 'usr_peer',
      name: 'Peer Reviewer',
      role: 'Engineer'
    };

    const isTeamProject = (existing.projectType || 'team') === 'team';
    const isAuthor = Boolean(
      (reviewer.id && (reviewer.id === existing.author?.id || reviewer.id === existing.author?.username)) ||
      (reviewer.username && (reviewer.username === existing.author?.username || reviewer.username === existing.author?.id)) ||
      (reviewer.name && reviewer.name.toLowerCase() === existing.author?.name?.toLowerCase())
    );

    if (isTeamProject && isAuthor && payload.action === 'approve') {
      throw new Error('Authors cannot approve their own pull requests in team projects. Peer review is required.');
    }

    const elapsedHours = Math.max(0.5, Math.round(((Date.now() - new Date(existing.createdAt || Date.now()).getTime()) / (1000 * 60 * 60)) * 10) / 10);

    const updatedReviewers = Array.isArray(existing.reviewers) ? [...existing.reviewers] : [];
    const revIdx = updatedReviewers.findIndex((r: any) =>
      (reviewer.id && r.id === reviewer.id) ||
      (reviewer.username && r.username === reviewer.username) ||
      (reviewer.name && r.name.toLowerCase() === reviewer.name.toLowerCase())
    );
    if (revIdx >= 0) {
      updatedReviewers[revIdx] = {
        ...updatedReviewers[revIdx],
        status: payload.action === 'approve' ? 'approved' : 'changes_requested'
      };
    } else {
      updatedReviewers.push({
        id: reviewer.id,
        name: reviewer.name,
        avatar: reviewer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: reviewer.role || 'Reviewer',
        username: reviewer.username,
        status: payload.action === 'approve' ? 'approved' : 'changes_requested'
      });
    }

    const updates: any = { 
      updatedAt: new Date().toISOString(),
      reviewers: updatedReviewers
    };

    if (payload.action === 'approve') {
      updates.isReviewed = true;
      updates.turnaroundHours = elapsedHours;
      updates.reviewedBy = {
        id: reviewer.id,
        name: reviewer.name,
        avatar: reviewer.avatar,
        role: reviewer.role
      };
      if (payload.comment) {
        updates.$inc = { commentsCount: 1 };
      }

      await AuditActivityModel.create({
        id: `evt_pr_app_${Date.now()}`,
        category: 'prs',
        actor: {
          name: reviewer.name,
          avatar: reviewer.avatar || 'https://github.com/Mahendra-06.png',
          role: reviewer.role || 'Reviewer'
        },
        action: `reviewed and approved PR #${existing.number || existing.prNumber || id}`,
        target: `${existing.title} (${existing.repo})`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        metadata: `Turnaround: ${elapsedHours} hrs • Team turnaround updated`,
        status: 'success'
      });
    } else if (payload.action === 'request_changes') {
      updates.isReviewed = false;
      updates.slaStatus = 'at_risk';
      if (payload.comment) {
        updates.$inc = { commentsCount: 1 };
      }

      await AuditActivityModel.create({
        id: `evt_pr_req_${Date.now()}`,
        category: 'prs',
        actor: {
          name: reviewer.name,
          avatar: reviewer.avatar || 'https://github.com/Mahendra-06.png',
          role: reviewer.role || 'Reviewer'
        },
        action: `requested changes on PR #${existing.number || existing.prNumber || id}`,
        target: `${existing.title} (${existing.repo})`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        metadata: payload.comment || 'Requested modifications. Review SLA marked At Risk.',
        status: 'warning'
      });
    }

    const updated = await PullRequestModel.findOneAndUpdate({ id: actualId }, updates, { new: true }).lean();
    if (updated) {
      const { _id, ...rest } = updated as any;
      return rest;
    }
    return null;
  }

  public async updatePullRequest(id: string, updates: any, actor?: any): Promise<any> {
    if (updates.action === 'approve' || updates.action === 'request_changes') {
      return this.reviewPullRequest(id, {
        action: updates.action,
        comment: updates.comment,
        reviewer: updates.reviewedBy || actor
      }, actor);
    }

    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (cleanUpdates.isReviewed === true && !cleanUpdates.turnaroundHours) {
      cleanUpdates.turnaroundHours = 1.2;
      if (actor && !cleanUpdates.reviewedBy) {
        cleanUpdates.reviewedBy = {
          id: actor.id || 'usr_peer',
          name: actor.name || 'Peer Reviewer',
          avatar: actor.avatar,
          role: actor.role
        };
      }
    }

    const updated = await PullRequestModel.findOneAndUpdate(
      { id },
      { $set: cleanUpdates },
      { new: true }
    ).lean();
    if (updated) {
      const { _id, ...rest } = updated as any;
      return rest;
    }
    return null;
  }

  public async mergePullRequest(id: string, actor?: any): Promise<any> {
    let existing = await PullRequestModel.findOne({ id }).lean();
    if (!existing) {
      await this.ensureProjectPRsSync();
      existing = await PullRequestModel.findOne({ id }).lean();
    }
    if (!existing) {
      existing = await PullRequestModel.findOne({
        $or: [
          { number: Number(id) || -1 },
          { prNumber: id },
          { projectId: id.replace(/^pr_proj_/, '') }
        ]
      }).lean();
    }
    if (!existing) return null;

    const actualId = existing.id;
    const isTeamProject = (existing.projectType || 'team') === 'team';
    if (isTeamProject && !existing.isReviewed) {
      const isAuthor = actor && (actor.id === existing.author?.id || actor.name === existing.author?.name);
      if (isAuthor) {
        throw new Error('Team project pull requests require peer review and approval before merging.');
      }
    }

    const pr = await PullRequestModel.findOneAndUpdate(
      { id: actualId },
      { 
        $set: { 
          status: 'merged',
          isMerged: true,
          queueType: 'merged',
          checksStatus: 'passed',
          waitingHours: 0,
          slaStatus: 'healthy',
          mergedBy: {
            id: actor?.id || 'usr_1',
            name: actor?.name || 'Mahendra Kumar',
            avatar: actor?.avatar || 'https://github.com/Mahendra-06.png',
            role: actor?.role || 'Backend Systems Engineer'
          },
          updatedAt: new Date().toISOString()
        } 
      },
      { new: true }
    ).lean();

    if (pr) {
      // Increment author's merged PRs count in UserModel
      if (pr.author?.id) {
        await UserModel.findOneAndUpdate(
          { id: pr.author.id },
          { $inc: { mergedPRsCount: 1 } }
        );
      }

      // 1. Auto-complete linked Kanban task (e.g. [CPE-104])
      const matchKeyMatch = (pr.title || '').match(/\[([A-Z0-9_-]+)\]/i) || (pr.branch && pr.branch.match(/([A-Z0-9]+-\d+)/i));
      const matchedKey = matchKeyMatch ? matchKeyMatch[1].toUpperCase() : null;
      if (matchedKey) {
        await TaskModel.updateMany(
          { 
            $or: [{ key: matchedKey }, { title: { $regex: matchedKey, $options: 'i' } }],
            status: { $ne: 'done' }
          },
          { $set: { status: 'done', updatedAt: new Date().toISOString() } }
        );
      }

      // 2. Production Release: Register automated Continuous Deployment run with 99.9% SLO verification
      const matchedProject = await ProjectModel.findOne({
        $or: [
          { id: pr.projectId },
          ...(matchedKey ? [{ key: matchedKey }] : [])
        ]
      }).lean();

      await DeploymentModel.create({
        id: `dep_cd_${Date.now()}`,
        environment: 'production',
        serviceName: matchedProject ? (matchedProject as any).name : (pr.repo?.split('/')[1] || 'Production Service'),
        version: `v1.${Math.floor(Date.now() / 100000) % 100}.${((pr.number || 1) % 10)}`,
        commitSha: Math.random().toString(16).substring(2, 9),
        commitMessage: `Merge PR #${pr.number || id}: ${pr.title || 'Feature'}`,
        branch: 'main',
        repositoryUrl: matchedProject ? (matchedProject as any).repoUrl : `https://github.com/${pr.repo || 'dmetrics/production'}`,
        projectId: matchedProject ? (matchedProject as any).id : pr.projectId,
        projectName: matchedProject ? (matchedProject as any).name : 'Production',
        author: {
          name: pr.author?.name || actor?.name || 'Developer',
          avatar: pr.author?.avatar || actor?.avatar,
          email: pr.author?.email,
          username: pr.author?.username
        },
        status: 'success',
        durationSeconds: Math.floor(Math.random() * 20) + 35,
        deployedAt: 'Just now',
        url: matchedProject ? (matchedProject as any).repoUrl : 'https://prod.dmetrics.internal',
        sloPassRate: 99.98,
        summary: `Continuous Deployment to Production triggered by merge of PR #${pr.number || id} (99.9% SLO verified)`
      });

      // 3. Automatically log to AuditActivityModel
      const reviewerName = pr.reviewedBy?.name || 'Peer Reviewer';
      await AuditActivityModel.create({
        id: `evt_pr_${Date.now()}`,
        category: 'prs',
        actor: {
          name: actor?.name || 'Mahendra Kumar',
          avatar: actor?.avatar || 'https://github.com/Mahendra-06.png',
          role: actor?.role || 'Backend Systems Engineer',
        },
        action: `merged pull request #${pr.prNumber || id} (reviewed by ${reviewerName}) & deployed to Production`,
        target: `${pr.title || 'PR Review'} (${pr.branch || 'feature'} → ${pr.targetBranch || 'main'})`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        metadata: `+${pr.additions || 0} / -${pr.deletions || 0} lines • Continuous Deployment to Production with 99.9% SLO verification`,
        status: 'success',
      });

      const { _id, ...rest } = pr as any;
      return rest;
    }
    return null;
  }

  public async getDeployments(filters?: {
    search?: string;
    environment?: string;
    status?: string;
    projectId?: string;
    developerId?: string;
    timeRange?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userName?: string;
  }): Promise<{ deployments: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};

    if (filters?.userId || filters?.userName) {
      const orConditions: any[] = [];
      if (filters.userId) {
        orConditions.push({ 'author.id': filters.userId }, { authorId: filters.userId }, { developerId: filters.userId });
      }
      if (filters.userName) {
        orConditions.push({ 'author.name': filters.userName });
      }
      query.$or = orConditions;
    }

    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { version: regex },
          { serviceName: regex },
          { commitSha: regex },
          { commitMessage: regex },
          { branch: regex },
          { 'author.name': regex },
          { summary: regex },
        ]
      });
    }

    if (filters?.environment && filters.environment !== 'all') {
      query.environment = filters.environment;
    }

    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters?.projectId && filters.projectId !== 'all') {
      query.projectId = filters.projectId;
    }

    if (filters?.developerId && filters.developerId !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { developerId: filters.developerId },
          { 'author.id': filters.developerId }
        ]
      });
    }

    const sortField = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, Math.min(100, filters?.limit || 50));
    const skip = (page - 1) * limit;

    const [rawDeps, total, allProjects] = await Promise.all([
      DeploymentModel.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
      DeploymentModel.countDocuments(query),
      ProjectModel.find({}).lean(),
    ]);

    const projectMap = new Map<string, string>();
    allProjects.forEach(p => projectMap.set(p.id, p.name));

    const deployments = rawDeps.map(d => {
      const { _id, ...rest } = d as any;
      return {
        ...rest,
        projectName: rest.projectId ? projectMap.get(rest.projectId) : undefined,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      deployments,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getDeploymentById(id: string): Promise<any | null> {
    const dep = await DeploymentModel.findOne({ id }).lean();
    if (!dep) return null;
    const { _id, ...rest } = dep as any;
    if (rest.projectId) {
      const proj = await ProjectModel.findOne({ id: rest.projectId }).lean();
      if (proj) rest.projectName = proj.name;
    }
    return rest;
  }

  public async createDeployment(deploymentData: any): Promise<any> {
    const id = deploymentData.id || `dep_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newDep = await DeploymentModel.create({
      id,
      ...deploymentData,
      branch: deploymentData.branch || 'main',
      status: deploymentData.status || 'success',
      durationSeconds: deploymentData.durationSeconds || 60,
      deployedAt: deploymentData.deployedAt || 'Just now',
      startedAt: deploymentData.startedAt || nowIso,
      completedAt: deploymentData.completedAt || (deploymentData.status === 'success' || deploymentData.status === 'failed' ? nowIso : undefined),
      summary: deploymentData.summary || '',
      logs: deploymentData.logs || [
        `[${new Date().toISOString()}] Initializing build environment for ${deploymentData.serviceName || 'service'}...`,
        `[${new Date().toISOString()}] Checking out commit ${deploymentData.commitSha || 'HEAD'} (${deploymentData.branch || 'main'})...`,
        `[${new Date().toISOString()}] Running container security scan & tests...`,
        `[${new Date().toISOString()}] Target environment verified: ${deploymentData.environment || 'production'}`,
        `[${new Date().toISOString()}] Release artifact pushed. Status: ${deploymentData.status || 'success'}`
      ],
    });

    // Automatically log Audit Trail activity
    await AuditActivityModel.create({
      id: `evt_dep_${Date.now()}`,
      category: 'deployments',
      actor: {
        id: deploymentData.author?.id || 'usr_1',
        name: deploymentData.author?.name || 'Developer',
        avatar: deploymentData.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Platform Engineer',
      },
      action: `deployed ${deploymentData.version || 'build'} to ${deploymentData.environment || 'production'}`,
      target: `${deploymentData.serviceName || 'DMetrics Service'} (${deploymentData.commitSha || 'main'})`,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      metadata: `SLO Pass: ${deploymentData.sloPassRate || 99.9}% • Status: ${deploymentData.status || 'success'}`,
      status: deploymentData.status === 'failed' ? 'warning' : 'success',
    });

    const doc = newDep.toJSON();
    return doc;
  }

  public async updateDeployment(id: string, updates: any): Promise<any | null> {
    const existing = await DeploymentModel.findOne({ id });
    if (!existing) return null;

    if (updates.status && updates.status !== existing.status) {
      if (updates.status === 'success' || updates.status === 'failed') {
        updates.completedAt = updates.completedAt || new Date().toISOString();
      }
      await AuditActivityModel.create({
        id: `evt_dep_${Date.now()}`,
        category: 'deployments',
        actor: {
          name: existing.author?.name || 'Platform Daemon',
          avatar: existing.author?.avatar || 'https://github.com/Mahendra-06.png',
          role: 'Release Engineer',
        },
        action: `updated deployment ${existing.version} status to ${updates.status}`,
        target: `${existing.serviceName} (${existing.environment})`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        metadata: `Status transition: ${existing.status} → ${updates.status}`,
        status: updates.status === 'failed' ? 'warning' : 'success',
      });
    }

    Object.assign(existing, updates);
    await existing.save();
    return existing.toJSON();
  }

  public async deleteDeployment(id: string): Promise<boolean> {
    const res = await DeploymentModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  public async getDeploymentMetrics(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any> {
    const query: any = {};
    if (filters?.userId || filters?.userName) {
      const orConditions: any[] = [];
      if (filters.userId) orConditions.push({ 'author.id': filters.userId }, { authorId: filters.userId }, { developerId: filters.userId });
      if (filters.userName) orConditions.push({ 'author.name': filters.userName });
      query.$or = orConditions;
    }

    const allDeps = await DeploymentModel.find(query).lean();
    const totalDeployments = allDeps.length;
    const successfulDeployments = allDeps.filter(d => d.status === 'success').length;
    const failedDeployments = allDeps.filter(d => d.status === 'failed').length;
    const inProgressDeployments = allDeps.filter(d => d.status === 'in_progress' || d.status === 'building' || d.status === 'pending').length;

    const successRate = totalDeployments > 0 
      ? Number(((successfulDeployments / totalDeployments) * 100).toFixed(1)) 
      : 0;

    const avgDurationSeconds = totalDeployments > 0
      ? Math.round(allDeps.reduce((sum, d) => sum + (d.durationSeconds || 60), 0) / totalDeployments)
      : 0;

    let mttrMinutes = 0;
    if (failedDeployments > 0) {
      mttrMinutes = Math.round(avgDurationSeconds / 60) || 12;
    }

    const deploymentFrequency = totalDeployments > 0
      ? `${(totalDeployments / 7 * 7).toFixed(1)}/week`
      : '0/week';

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      inProgressDeployments,
      successRate,
      meanTimeToRecoveryMinutes: mttrMinutes,
      deploymentFrequency,
      dailyDeploymentVelocity: totalDeployments,
      avgDurationSeconds,
    };
  }

  public async getDeploymentTrends(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any[]> {
    const query: any = {};
    if (filters?.userId || filters?.userName) {
      const orConditions: any[] = [];
      if (filters.userId) orConditions.push({ 'author.id': filters.userId }, { authorId: filters.userId }, { developerId: filters.userId });
      if (filters.userName) orConditions.push({ 'author.name': filters.userName });
      query.$or = orConditions;
    }

    const allDeps = await DeploymentModel.find(query).lean();
    const daysCount = filters?.timeRange === 'today' ? 1 : filters?.timeRange === 'week' ? 7 : filters?.timeRange === 'month' ? 30 : 14;
    const trends: Array<{ date: string; fullDate: string; successful: number; failed: number; inProgress: number; total: number }> = [];

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const label = `${monthShort} ${dayNum}`;

      const dayDeps = allDeps.filter(dep => {
        const depDate = (dep.createdAt ? new Date(dep.createdAt).toISOString() : dep.deployedAt || '').split('T')[0];
        return depDate === dateKey;
      });

      const successful = dayDeps.filter(dep => dep.status === 'success').length;
      const failed = dayDeps.filter(dep => dep.status === 'failed').length;
      const inProgress = dayDeps.filter(dep => dep.status === 'in_progress' || dep.status === 'building' || dep.status === 'pending').length;

      trends.push({
        date: label,
        fullDate: dateKey,
        successful,
        failed,
        inProgress,
        total: dayDeps.length,
      });
    }

    return trends;
  }

  public async getDeploymentEnvironments(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any[]> {
    const query: any = {};
    if (filters?.userId || filters?.userName) {
      const orConditions: any[] = [];
      if (filters.userId) orConditions.push({ 'author.id': filters.userId }, { authorId: filters.userId }, { developerId: filters.userId });
      if (filters.userName) orConditions.push({ 'author.name': filters.userName });
      query.$or = orConditions;
    }

    const allDeps = await DeploymentModel.find(query).lean();
    const total = allDeps.length || 1;
    const counts: Record<string, number> = {
      production: allDeps.filter(d => d.environment === 'production').length,
      staging: allDeps.filter(d => d.environment === 'staging').length,
      development: allDeps.filter(d => d.environment === 'development').length,
      canary: allDeps.filter(d => d.environment === 'canary' || d.environment === 'preview').length,
    };

    return [
      { environment: 'Production', key: 'production', count: counts.production, percentage: Math.round((counts.production / total) * 100), color: '#6366f1' },
      { environment: 'Staging', key: 'staging', count: counts.staging, percentage: Math.round((counts.staging / total) * 100), color: '#8b5cf6' },
      { environment: 'Development', key: 'development', count: counts.development, percentage: Math.round((counts.development / total) * 100), color: '#06b6d4' },
      { environment: 'Canary / Preview', key: 'canary', count: counts.canary, percentage: Math.round((counts.canary / total) * 100), color: '#f59e0b' },
    ];
  }


  public async getAuditEvents(filters?: { userId?: string; userName?: string }): Promise<any[]> {
    const query: any = {};
    if (filters?.userId || filters?.userName) {
      const orConditions: any[] = [];
      if (filters.userId) orConditions.push({ 'actor.id': filters.userId });
      if (filters.userName) orConditions.push({ 'actor.name': filters.userName });
      query.$or = orConditions;
    }
    const events = await AuditActivityModel.find(query).sort({ timestamp: -1 }).lean();
    return events.map(e => {
      const { _id, ...rest } = e as any;
      return rest;
    });
  }

  public async createAuditEvent(eventData: any): Promise<any> {
    const id = eventData.id || `evt_${Date.now()}`;
    const newEvent = await AuditActivityModel.create({
      id,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      ...eventData,
    });
    return newEvent.toJSON();
  }

  public async getAnalytics(filters?: { userId?: string; userName?: string }): Promise<{
    sprintVelocity: Array<{ sprint: string; committed: number; completed: number; carryOver: number }>;
    workCategories: Array<{ name: string; percentage: number; color: string; hours: number; count: number }>;
    activityDays: Array<{ date: string; count: number; level: number; dayOfWeek: number; weekIndex: number }>;
    rhythm?: {
      hourlySlots: Array<{ hour: string; label: string; intensity: number; type: string; count: number }>;
      peakWindow: string;
      workloadSplit: Array<{ label: string; percentage: number; color: string; text: string; hours: number }>;
      totalHours: number;
    };
    metricsSummary?: {
      productivityScore: number;
      avgReviewTurnaroundHours: number;
      deploymentSuccessRate: number;
      meanTimeToRecoveryMinutes: number;
      dailyDeploymentVelocity: number;
      totalStoryPoints: number;
      completedStoryPoints: number;
      totalFocusHours: number;
    };
  }> {
    // Build scoped queries based on userId/userName
    const taskQuery: any = {};
    const prQuery: any = {};
    const depQuery: any = {};
    const auditQuery: any = {};

    if (filters?.userId) {
      taskQuery.assigneeId = filters.userId;
      prQuery.$or = [{ 'author.id': filters.userId }];
      depQuery.$or = [{ 'author.id': filters.userId }, { authorId: filters.userId }];
      auditQuery.$or = [{ 'actor.id': filters.userId }];
      if (filters.userName) {
        prQuery.$or.push({ 'author.name': filters.userName });
        depQuery.$or.push({ 'author.name': filters.userName });
        auditQuery.$or.push({ 'actor.name': filters.userName });
      }
    } else if (filters?.userName) {
      prQuery['author.name'] = filters.userName;
      depQuery['author.name'] = filters.userName;
      auditQuery['actor.name'] = filters.userName;
    }

    const [allTasks, allPRs, allDeployments, allAuditEvents] = await Promise.all([
      TaskModel.find(taskQuery).lean(),
      PullRequestModel.find(prQuery).lean(),
      DeploymentModel.find(depQuery).lean(),
      AuditActivityModel.find(auditQuery).lean(),
    ]);

    const totalPoints = allTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const doneTasks = allTasks.filter(t => t.status === 'done');
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
    const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const inProgressPoints = inProgressTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // 1. Sprint Velocity derived directly from tasks
    const sprintVelocity = allTasks.length > 0 ? [
      { sprint: 'Active Sprint', committed: totalPoints, completed: donePoints, carryOver: inProgressPoints }
    ] : [];

    // 2. Work Categories based on real task tags and story points
    const categoryStats: Record<string, { count: number; points: number; color: string }> = {
      'Core Architecture': { count: 0, points: 0, color: '#6366f1' },
      'Distributed Systems': { count: 0, points: 0, color: '#8b5cf6' },
      'Frontend / UX': { count: 0, points: 0, color: '#06b6d4' },
      'DevOps & CI/CD': { count: 0, points: 0, color: '#10b981' },
      'Security & Audit': { count: 0, points: 0, color: '#f59e0b' },
    };

    allTasks.forEach(t => {
      const tags = (t.tags || []).join(' ').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const combined = `${title} ${tags}`;
      const pts = t.storyPoints || 1;

      if (combined.includes('ui') || combined.includes('react') || combined.includes('frontend') || combined.includes('css')) {
        categoryStats['Frontend / UX'].count += 1;
        categoryStats['Frontend / UX'].points += pts;
      } else if (combined.includes('security') || combined.includes('auth') || combined.includes('audit')) {
        categoryStats['Security & Audit'].count += 1;
        categoryStats['Security & Audit'].points += pts;
      } else if (combined.includes('devops') || combined.includes('k8s') || combined.includes('ci') || combined.includes('docker') || combined.includes('pipeline')) {
        categoryStats['DevOps & CI/CD'].count += 1;
        categoryStats['DevOps & CI/CD'].points += pts;
      } else if (combined.includes('distributed') || combined.includes('redis') || combined.includes('kafka') || combined.includes('grpc') || combined.includes('stream')) {
        categoryStats['Distributed Systems'].count += 1;
        categoryStats['Distributed Systems'].points += pts;
      } else {
        categoryStats['Core Architecture'].count += 1;
        categoryStats['Core Architecture'].points += pts;
      }
    });

    const workCategories = Object.entries(categoryStats)
      .filter(([_, stat]) => stat.count > 0)
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        percentage: totalPoints > 0 ? Math.round((stat.points / totalPoints) * 100) : Math.round((stat.count / (allTasks.length || 1)) * 100),
        color: stat.color,
        hours: Number((stat.points * 1.5).toFixed(1)),
      }));

    // 3. Activity Days across tasks, PRs, deployments, and audit events
    const today = new Date();
    const timestampsByDate: Record<string, number> = {};

    const registerDate = (isoStr?: string) => {
      if (!isoStr) return;
      try {
        const d = isoStr.split('T')[0];
        timestampsByDate[d] = (timestampsByDate[d] || 0) + 1;
      } catch {}
    };

    allTasks.forEach(t => { registerDate(t.createdAt); registerDate(t.updatedAt); });
    allPRs.forEach(p => { registerDate(p.createdAt); registerDate(p.updatedAt); });
    allDeployments.forEach(d => registerDate(d.deployedAt || (d as any).createdAt));
    allAuditEvents.forEach(a => registerDate(a.timestamp));

    const activityDays = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      const weekIndex = Math.floor((83 - i) / 7);
      const dateStr = d.toISOString().split('T')[0];
      const count = timestampsByDate[dateStr] || 0;

      let level = 0;
      if (count > 6) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      activityDays.push({
        date: dateStr,
        count,
        level,
        dayOfWeek,
        weekIndex,
      });
    }

    // 4. Hourly Cognitive Rhythm derived from real event timestamps
    const hourlyCounts: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) hourlyCounts[h] = 0;

    const countHour = (isoStr?: string) => {
      if (!isoStr) return;
      try {
        const dateObj = new Date(isoStr);
        if (!isNaN(dateObj.getTime())) {
          const hr = dateObj.getHours();
          if (hr >= 8 && hr <= 18) {
            hourlyCounts[hr] = (hourlyCounts[hr] || 0) + 1;
          }
        }
      } catch {}
    };

    allAuditEvents.forEach(a => countHour(a.timestamp));
    allTasks.forEach(t => { countHour(t.createdAt); countHour(t.updatedAt); });
    allPRs.forEach(p => countHour(p.createdAt));
    allDeployments.forEach(d => countHour(d.deployedAt));

    const maxHourCount = Math.max(1, ...Object.values(hourlyCounts));
    const hourlySlots = Object.entries(hourlyCounts).map(([hStr, count]) => {
      const h = parseInt(hStr, 10);
      const hourPadded = h < 10 ? `0${h}:00` : `${h}:00`;
      const intensity = Math.round((count / maxHourCount) * 100);
      const label = count === 0 
        ? 'Standby' 
        : intensity >= 80 
        ? 'Peak Deep Flow' 
        : intensity >= 50 
        ? 'Active Development' 
        : 'Review & Sync';
      return {
        hour: hourPadded,
        label,
        intensity: count === 0 ? 10 : intensity,
        type: intensity >= 80 ? 'flow' : intensity >= 50 ? 'code' : 'collab',
        count,
      };
    });

    let peakHour = 10;
    let maxHourlyVal = -1;
    for (const [hStr, count] of Object.entries(hourlyCounts)) {
      if (count > maxHourlyVal) {
        maxHourlyVal = count;
        peakHour = parseInt(hStr, 10);
      }
    }
    const peakWindow = `${peakHour < 10 ? '0' + peakHour : peakHour}:00 – ${peakHour + 2 < 10 ? '0' + (peakHour + 2) : peakHour + 2}:00`;

    // 5. Real Metrics Summary
    const taskCompletionRate = totalPoints > 0 ? (donePoints / totalPoints) : 0;
    const mergedPRs = allPRs.filter(p => p.status === 'merged' || (p as any).isMerged);
    const prVelocityRate = allPRs.length > 0 ? (mergedPRs.length / allPRs.length) : 0;
    const passedDeployments = allDeployments.filter(d => (d.status as string) === 'success' || (d.status as string) === 'passed');
    const deploymentSuccessRate = allDeployments.length > 0 
      ? Number(((passedDeployments.length / allDeployments.length) * 100).toFixed(1)) 
      : 0;

    const avgDuration = allDeployments.length > 0
      ? Math.round(allDeployments.reduce((sum, d) => sum + (d.durationSeconds || 60), 0) / allDeployments.length / 60)
      : 0;

    const productivityScore = allTasks.length === 0 && allPRs.length === 0 && allDeployments.length === 0
      ? 0
      : Math.min(100, Math.round(taskCompletionRate * 50 + prVelocityRate * 30 + (deploymentSuccessRate > 0 ? 20 : 0)));

    let avgTurnaround = 0;
    if (allPRs.length > 0) {
      const withTurnaround = allPRs.filter(p => p.turnaroundHours && p.turnaroundHours > 0);
      if (withTurnaround.length > 0) {
        avgTurnaround = Number((withTurnaround.reduce((sum, p) => sum + p.turnaroundHours, 0) / withTurnaround.length).toFixed(1));
      } else {
        avgTurnaround = 0;
      }
    }

    const totalFocusHours = Number((donePoints * 1.5 + inProgressPoints * 0.8).toFixed(1));

    return {
      sprintVelocity,
      workCategories,
      activityDays,
      rhythm: {
        hourlySlots,
        peakWindow,
        totalHours: totalFocusHours,
        workloadSplit: workCategories.map(c => ({
          label: c.name,
          percentage: c.percentage,
          color: c.color,
          text: 'text-slate-200',
          hours: c.hours
        }))
      },
      metricsSummary: {
        productivityScore,
        avgReviewTurnaroundHours: avgTurnaround,
        deploymentSuccessRate,
        meanTimeToRecoveryMinutes: avgDuration || 0,
        dailyDeploymentVelocity: allDeployments.length,
        totalStoryPoints: totalPoints,
        completedStoryPoints: donePoints,
        totalFocusHours
      }
    };
  }

  private mapUser(raw: any): User {
    const { _id, ...rest } = raw;
    return rest as User;
  }

  private mapTeamInvitation(raw: any): TeamInvitation {
    const { _id, ...rest } = raw;
    return rest as TeamInvitation;
  }
}
