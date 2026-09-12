import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { upload } from "../middleware/upload.js";
import { AuthenticatedRequest, signToken } from "../middleware/auth.js";
import { io, broadcastSSE } from "../index.js";

export const router = Router();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

// Login: POST /api/collections/users/auth-with-password
router.post(
  "/users/auth-with-password",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const identity = req.body.identity || req.body.email;
      const password = req.body.password;

      if (!identity || !password) {
        return res
          .status(400)
          .json({ message: "Identity and password are required" });
      }

      const user = await prisma.user.findUnique({
        where: { email: identity.toLowerCase().trim() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = signToken({ id: user.id, email: user.email });

      const record = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        description: user.description,
        location: user.location,
        verified: user.verified,
        emailVisibility: user.emailVisibility,
        firstLogin: user.firstLogin,
        created: user.created.toISOString(),
        updated: user.updated.toISOString(),
        collectionName: "users",
      };

      return res.json({ token, record });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create User (Sign up): POST /api/collections/users/records
router.post(
  "/users/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, email, password, passwordConfirm, emailVisibility } =
        req.body;

      if (!email || !password) {
        return res.status(400).json({
          code: 400,
          message: "Email and password are required",
          data: { email: { code: "validation_required" } },
        });
      }

      if (passwordConfirm && password !== passwordConfirm) {
        return res
          .status(400)
          .json({ message: "Passwords do not match", data: {} });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: "Email already exists",
          data: { email: { code: "validation_not_unique" } },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name || normalizedEmail.split("@")[0],
          emailVisibility: emailVisibility !== false,
          firstLogin: false,
        },
      });

      return res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        description: newUser.description,
        location: newUser.location,
        verified: newUser.verified,
        firstLogin: newUser.firstLogin,
        created: newUser.created.toISOString(),
        updated: newUser.updated.toISOString(),
        collectionName: "users",
      });
    } catch (error: any) {
      console.error("User creation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get User: GET /api/collections/users/records/:id
router.get(
  "/users/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        description: user.description,
        location: user.location,
        verified: user.verified,
        firstLogin: user.firstLogin,
        created: user.created.toISOString(),
        updated: user.updated.toISOString(),
        collectionName: "users",
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update User: PATCH /api/collections/users/records/:id
router.patch(
  "/users/records/:id",
  upload.single("avatar"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.location !== undefined)
        updateData.location = req.body.location;
      if (req.body.firstLogin !== undefined)
        updateData.firstLogin =
          req.body.firstLogin === true || req.body.firstLogin === "true";

      // File upload for avatar
      if (req.file) {
        updateData.avatar = req.file.filename;
      }

      // Password change
      if (req.body.password && req.body.oldPassword) {
        const isValid = await bcrypt.compare(
          req.body.oldPassword,
          user.password
        );
        if (!isValid) {
          return res.status(400).json({ message: "Old password is incorrect" });
        }
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        description: updatedUser.description,
        location: updatedUser.location,
        verified: updatedUser.verified,
        firstLogin: updatedUser.firstLogin,
        created: updatedUser.created.toISOString(),
        updated: updatedUser.updated.toISOString(),
        collectionName: "users",
      });
    } catch (error: any) {
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================
// 2. COMMUNITIES
// ==========================================

const formatCommunity = (c: any) => ({
  id: c.id,
  name: c.name,
  category: c.category,
  price: c.price,
  type: c.type,
  description: c.description,
  banner: c.banner,
  avatar: c.avatar,
  createdBy: c.createdBy,
  collectionName: "all_communities",
  created: c.created.toISOString(),
  updated: c.updated.toISOString(),
  members: c.members ? c.members.map((m: any) => m.userId || m) : [],
  expand: {
    createdBy: c.creator
      ? {
          id: c.creator.id,
          name: c.creator.name,
          avatar: c.creator.avatar,
          email: c.creator.email,
          description: c.creator.description,
          location: c.creator.location,
          verified: c.creator.verified,
        }
      : undefined,
    members: c.members
      ? c.members.map((m: any) => ({
          id: m.user?.id || m.userId,
          name: m.user?.name || "",
          avatar: m.user?.avatar || "",
          email: m.user?.email || "",
          description: m.user?.description || "",
          location: m.user?.location || "",
          verified: m.user?.verified || false,
        }))
      : [],
  },
});

// Get all communities: GET /api/collections/all_communities/records
router.get(
  "/all_communities/records",
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const communities = await prisma.community.findMany({
        include: {
          creator: true,
          members: {
            include: { user: true },
          },
        },
        orderBy: { created: "desc" },
      });

      return res.json({
        items: communities.map(formatCommunity),
        totalItems: communities.length,
      });
    } catch (error: any) {
      console.error("List communities error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get one community: GET /api/collections/all_communities/records/:id
router.get(
  "/all_communities/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const community = await prisma.community.findUnique({
        where: { id: req.params.id },
        include: {
          creator: true,
          members: {
            include: { user: true },
          },
        },
      });

      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      return res.json(formatCommunity(community));
    } catch (error: any) {
      console.error("Get community error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create community: POST /api/collections/all_communities/records
router.post(
  "/all_communities/records",
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, category, type, price, createdBy } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const bannerFilename = files?.banner?.[0]?.filename || "";
      const avatarFilename = files?.avatar?.[0]?.filename || "";

      const creatorId = createdBy || req.userId;
      if (!creatorId) {
        return res.status(400).json({ message: "Creator ID is required" });
      }

      const newCommunity = await prisma.community.create({
        data: {
          name,
          description: description || "",
          category: category || "general",
          type: type || "public",
          price: price || "free",
          banner: bannerFilename,
          avatar: avatarFilename,
          createdBy: creatorId,
          members: {
            create: {
              userId: creatorId,
            },
          },
        },
        include: {
          creator: true,
          members: { include: { user: true } },
        },
      });

      return res.status(201).json(formatCommunity(newCommunity));
    } catch (error: any) {
      console.error("Create community error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update community (Join, Leave, Edit): PATCH /api/collections/all_communities/records/:id
router.patch(
  "/all_communities/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const communityId = req.params.id;
      const { members, name, description } = req.body;

      if (Array.isArray(members)) {
        // Synchronize members
        await prisma.communityMember.deleteMany({
          where: {
            communityId,
            userId: { notIn: members },
          },
        });

        for (const uId of members) {
          await prisma.communityMember.upsert({
            where: {
              communityId_userId: { communityId, userId: uId },
            },
            update: {},
            create: { communityId, userId: uId },
          });
        }
      }

      const updated = await prisma.community.update({
        where: { id: communityId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
        },
        include: {
          creator: true,
          members: { include: { user: true } },
        },
      });

      return res.json(formatCommunity(updated));
    } catch (error: any) {
      console.error("Update community error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete community: DELETE /api/collections/all_communities/records/:id
router.delete(
  "/all_communities/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await prisma.community.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    } catch (error: any) {
      console.error("Delete community error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================
// 3. POSTS
// ==========================================

const formatPost = (p: any) => ({
  id: p.id,
  title: p.title,
  content: p.content,
  post: p.post,
  media: p.media,
  community: p.communityId,
  user: p.userId,
  likes: p.likes ? p.likes.map((l: any) => l.userId || l) : [],
  collectionName: "posts",
  created: p.created.toISOString(),
  updated: p.updated.toISOString(),
  expand: {
    user: p.user
      ? {
          id: p.user.id,
          name: p.user.name,
          avatar: p.user.avatar,
          email: p.user.email,
          description: p.user.description,
          location: p.user.location,
          verified: p.user.verified,
        }
      : undefined,
  },
});

// List posts: GET /api/collections/posts/records
router.get(
  "/posts/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      let communityId: string | undefined;

      if (filter && filter.includes("community=")) {
        const match = filter.match(/community=["']?([^"']+)["']?/);
        if (match) communityId = match[1];
      }

      const posts = await prisma.post.findMany({
        where: communityId ? { communityId } : undefined,
        include: {
          user: true,
          likes: true,
        },
        orderBy: { created: "desc" },
      });

      return res.json({
        items: posts.map(formatPost),
        totalItems: posts.length,
      });
    } catch (error: any) {
      console.error("List posts error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get one post: GET /api/collections/posts/records/:id
router.get(
  "/posts/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: {
          user: true,
          likes: true,
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.json(formatPost(post));
    } catch (error: any) {
      console.error("Get post error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create post: POST /api/collections/posts/records
router.post(
  "/posts/records",
  upload.single("media"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, content, post, community, user } = req.body;
      const mediaFilename = req.file ? req.file.filename : "";

      const authorId = user || req.userId;
      if (!authorId || !community) {
        return res
          .status(400)
          .json({ message: "User and Community are required" });
      }

      const newPost = await prisma.post.create({
        data: {
          title: title || "",
          content: content || post || "",
          post: post || content || "",
          media: mediaFilename,
          communityId: community,
          userId: authorId,
        },
        include: {
          user: true,
          likes: true,
        },
      });

      return res.status(201).json(formatPost(newPost));
    } catch (error: any) {
      console.error("Create post error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update post (e.g. Likes): PATCH /api/collections/posts/records/:id
router.patch(
  "/posts/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const postId = req.params.id;
      const { likes } = req.body;

      if (Array.isArray(likes)) {
        await prisma.postLike.deleteMany({
          where: {
            postId,
            userId: { notIn: likes },
          },
        });

        for (const uId of likes) {
          await prisma.postLike.upsert({
            where: { postId_userId: { postId, userId: uId } },
            update: {},
            create: { postId, userId: uId },
          });
        }
      }

      const updated = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: true,
          likes: true,
        },
      });

      return res.json(formatPost(updated));
    } catch (error: any) {
      console.error("Update post error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete post: DELETE /api/collections/posts/records/:id
router.delete(
  "/posts/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await prisma.post.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    } catch (error: any) {
      console.error("Delete post error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================
// 4. COMMENTS
// ==========================================

const formatComment = (c: any) => ({
  id: c.id,
  content: c.content,
  post: c.postId,
  user: c.userId,
  collectionName: "comments",
  created: c.created.toISOString(),
  updated: c.updated.toISOString(),
  expand: {
    user: c.user
      ? {
          id: c.user.id,
          name: c.user.name,
          avatar: c.user.avatar,
          email: c.user.email,
          description: c.user.description,
          location: c.user.location,
          verified: c.user.verified,
        }
      : undefined,
  },
});

// List comments: GET /api/collections/comments/records
router.get(
  "/comments/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      let postId: string | undefined;

      if (filter && filter.includes("post=")) {
        const match = filter.match(/post=["']?([^"']+)["']?/);
        if (match) postId = match[1];
      }

      const comments = await prisma.comment.findMany({
        where: postId ? { postId } : undefined,
        include: { user: true },
        orderBy: { created: "desc" },
      });

      return res.json({
        items: comments.map(formatComment),
        totalItems: comments.length,
      });
    } catch (error: any) {
      console.error("List comments error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create comment: POST /api/collections/comments/records
router.post(
  "/comments/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, post, user } = req.body;
      const authorId = user || req.userId;

      if (!content || !post || !authorId) {
        return res
          .status(400)
          .json({ message: "Content, post, and user are required" });
      }

      const newComment = await prisma.comment.create({
        data: {
          content,
          postId: post,
          userId: authorId,
        },
        include: { user: true },
      });

      return res.status(201).json(formatComment(newComment));
    } catch (error: any) {
      console.error("Create comment error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================
// 5. CONVERSATIONS & MESSAGES
// ==========================================

const formatConversation = (c: any) => ({
  id: c.id,
  community_id: c.communityId,
  seen: c.seen,
  created: c.created.toISOString(),
  updated: c.updated.toISOString(),
  users: c.participants
    ? c.participants.map((p: any) => p.userId || p.user?.id)
    : [],
  messages: c.messages ? c.messages.map((m: any) => m.id) : [],
  collectionName: "conversations",
  expand: {
    users: c.participants
      ? c.participants.map((p: any) => ({
          id: p.user?.id || p.userId,
          name: p.user?.name || "",
          avatar: p.user?.avatar || "",
          email: p.user?.email || "",
          description: p.user?.description || "",
          location: p.user?.location || "",
          verified: p.user?.verified || false,
        }))
      : [],
    messages: c.messages ? c.messages.map(formatMessage) : [],
  },
});

const formatMessage = (m: any) => ({
  id: m.id,
  conversation: m.conversationId,
  sender_id: m.senderId,
  receiver_id: m.receiverId,
  community_id: m.communityId,
  message: m.message,
  seen: m.seen,
  created: m.created.toISOString(),
  updated: m.updated.toISOString(),
  collectionName: "messages",
  expand: {
    sender_id: m.sender
      ? {
          id: m.sender.id,
          name: m.sender.name,
          avatar: m.sender.avatar,
          email: m.sender.email,
        }
      : undefined,
  },
});

// List conversations: GET /api/collections/conversations/records
router.get(
  "/conversations/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      let targetUserId = req.userId;

      if (filter && filter.includes("users ~")) {
        const match = filter.match(/users ~ ["']?([^"']+)["']?/);
        if (match) targetUserId = match[1];
      }

      const conversations = await prisma.conversation.findMany({
        where: targetUserId
          ? {
              participants: {
                some: { userId: targetUserId },
              },
            }
          : undefined,
        include: {
          participants: { include: { user: true } },
          messages: {
            include: { sender: true },
            orderBy: { created: "asc" },
          },
        },
        orderBy: { created: "desc" },
      });

      return res.json({
        items: conversations.map(formatConversation),
        totalItems: conversations.length,
      });
    } catch (error: any) {
      console.error("List conversations error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get one conversation: GET /api/collections/conversations/records/:id
router.get(
  "/conversations/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: req.params.id },
        include: {
          participants: { include: { user: true } },
          messages: {
            include: { sender: true },
            orderBy: { created: "asc" },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      return res.json(formatConversation(conversation));
    } catch (error: any) {
      console.error("Get conversation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create conversation: POST /api/collections/conversations/records
router.post(
  "/api/collections/conversations/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { users, community_id } = req.body;
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: "Users array is required" });
      }

      // Filter out null/undefined users
      const validUsers = users.filter((u: any) => !!u);

      const conversation = await prisma.conversation.create({
        data: {
          communityId: community_id || "",
          seen: false,
          participants: {
            create: validUsers.map((uId: string) => ({ userId: uId })),
          },
        },
        include: {
          participants: { include: { user: true } },
          messages: { include: { sender: true } },
        },
      });

      return res.status(201).json(formatConversation(conversation));
    } catch (error: any) {
      console.error("Create conversation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update conversation: PATCH /api/collections/conversations/records/:id
router.patch(
  "/conversations/records/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { seen } = req.body;
      const conversation = await prisma.conversation.update({
        where: { id: req.params.id },
        data: {
          ...(seen !== undefined && { seen }),
        },
        include: {
          participants: { include: { user: true } },
          messages: { include: { sender: true } },
        },
      });

      return res.json(formatConversation(conversation));
    } catch (error: any) {
      console.error("Update conversation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// List messages: GET /api/collections/messages/records
router.get(
  "/messages/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      let conversationId: string | undefined;

      if (filter && filter.includes("conversation=")) {
        const match = filter.match(/conversation=["']?([^"']+)["']?/);
        if (match) conversationId = match[1];
      }

      const messages = await prisma.message.findMany({
        where: conversationId ? { conversationId } : undefined,
        include: { sender: true },
        orderBy: { created: "asc" },
      });

      return res.json({
        items: messages.map(formatMessage),
        totalItems: messages.length,
      });
    } catch (error: any) {
      console.error("List messages error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create message: POST /api/collections/messages/records
router.post(
  "/messages/records",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message, sender_id, receiver_id, conversation, community_id } =
        req.body;

      const senderId = sender_id || req.userId;
      if (!conversation || !senderId || !message) {
        return res
          .status(400)
          .json({ message: "Conversation, sender, and message are required" });
      }

      const newMessage = await prisma.message.create({
        data: {
          conversationId: conversation,
          senderId,
          receiverId: receiver_id || "",
          communityId: community_id || "",
          message,
          seen: false,
        },
        include: { sender: true },
      });

      const formatted = formatMessage(newMessage);

      // Emit realtime event via Socket.io & SSE
      io.to(conversation).emit("message:created", formatted);
      io.emit("message:created", formatted);
      broadcastSSE("messages", "create", formatted);

      return res.status(201).json(formatted);
    } catch (error: any) {
      console.error("Create message error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
