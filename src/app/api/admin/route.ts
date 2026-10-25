import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifySessionToken } from "../../../lib/auth";
import { harvestOaiRecords, identifyOaiRepository } from "../../../lib/oai-harvester";
import { getDisciplines, assignQuartiles } from "../../../lib/metrics";

// Helper to authenticate and verify ADMIN role
async function getAdminUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("afriJournalSession");
  const token = sessionCookie?.value;

  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchJournal = searchParams.get("searchJournal") || "";
    const searchUser = searchParams.get("searchUser") || "";

    // 1. Safe overview metrics
    const [
      totalJournals,
      indexedJournals,
      paidCertificates,
      totalSubmissions,
      pendingSubmissions,
      totalClaims,
      pendingClaims,
      totalUsers,
      totalResearchers,
      totalPublishers,
      totalAdmins,
      totalForumTopics,
      totalForumReplies,
      totalPosts,
      totalJournalComments,
      scopusJournals,
      wosJournals
    ] = await Promise.all([
      prisma.journal.count().catch(() => 0),
      prisma.journal.count({ where: { isIndexed: true } }).catch(() => 0),
      prisma.journal.count({ where: { certificatePaid: true } }).catch(() => 0),
      prisma.submission.count().catch(() => 0),
      prisma.submission.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }).catch(() => 0),
      prisma.claimedPublication.count().catch(() => 0),
      prisma.claimedPublication.count({ where: { status: "PENDING_AUDIT" } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { role: "RESEARCHER" } }).catch(() => 0),
      prisma.user.count({ where: { role: "PUBLISHER" } }).catch(() => 0),
      prisma.user.count({ where: { role: "ADMIN" } }).catch(() => 0),
      prisma.forumTopic.count().catch(() => 0),
      prisma.forumReply.count().catch(() => 0),
      prisma.post.count().catch(() => 0),
      prisma.comment.count().catch(() => 0),
      prisma.journal.count({ where: { isScopusIndexed: true } }).catch(() => 0),
      prisma.journal.count({ where: { isWosIndexed: true } }).catch(() => 0)
    ]);

    // 2. Submissions list
    let submissions: any[] = [];
    try {
      submissions = await prisma.submission.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          submitter: {
            select: { id: true, name: true, email: true, institution: true }
          },
          journal: {
            select: { id: true, name: true, isIndexed: true, certificatePaid: true }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin submissions error:", err);
    }

    // 3. Pending & recent publication claims
    let claims: any[] = [];
    try {
      claims = await prisma.claimedPublication.findMany({
        take: 100,
        orderBy: { claimedAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, institution: true, orcid: true }
          },
          article: {
            select: {
              id: true,
              title: true,
              doi: true,
              publishDate: true,
              journal: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin claims error:", err);
    }

    // 4. Journals list with live search support
    let journals: any[] = [];
    const journalWhere: any = {};
    if (searchJournal.trim()) {
      journalWhere.OR = [
        { name: { contains: searchJournal.trim() } },
        { issn: { contains: searchJournal.trim() } },
        { eissn: { contains: searchJournal.trim() } },
        { country: { contains: searchJournal.trim() } },
        { publisherName: { contains: searchJournal.trim() } }
      ];
    }

    try {
      journals = await prisma.journal.findMany({
        where: journalWhere,
        take: 200,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          country: true,
          publisherName: true,
          isIndexed: true,
          certificatePaid: true,
          isScopusIndexed: true,
          isWosIndexed: true,
          qualityGrade: true,
          activeTier: true,
          publisherId: true,
          websiteUrl: true,
          indexedAt: true,
          publisher: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin journals error:", err);
    }

    // 5. Forum Topics for Moderation Desk
    let forumTopics: any[] = [];
    try {
      forumTopics = await prisma.forumTopic.findMany({
        take: 60,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { replies: true } }
        }
      });
    } catch (err: any) {
      console.error("Admin forum topics error:", err);
    }

    // 6. Scholar Social Posts for Moderation Desk
    let posts: any[] = [];
    try {
      posts = await prisma.post.findMany({
        take: 60,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, institution: true } },
          _count: { select: { comments: true, likes: true } }
        }
      });
    } catch (err: any) {
      console.error("Admin posts error:", err);
    }

    // 7. Journal Comments for Moderation Desk
    let comments: any[] = [];
    try {
      comments = await prisma.comment.findMany({
        take: 60,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          journal: { select: { id: true, name: true } }
        }
      });
    } catch (err: any) {
      console.error("Admin comments error:", err);
    }

    // 8. Users Roster
    let users: any[] = [];
    const userWhere: any = {};
    if (searchUser.trim()) {
      userWhere.OR = [
        { name: { contains: searchUser.trim() } },
        { email: { contains: searchUser.trim() } },
        { institution: { contains: searchUser.trim() } }
      ];
    }
    try {
      users = await prisma.user.findMany({
        where: userWhere,
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institution: true,
          department: true,
          totalCitations: true,
          hIndex: true,
          orcid: true,
          isClaimed: true,
          createdAt: true
        }
      });
    } catch (err: any) {
      console.error("Admin users error:", err);
    }

    // 9. Recent Payments
    let payments: any[] = [];
    try {
      payments = await prisma.payment.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          journal: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });
    } catch (err: any) {
      console.error("Admin payments error:", err);
    }

    return NextResponse.json({
      success: true,
      admin: adminUser,
      stats: {
        totalJournals,
        indexedJournals,
        paidCertificates,
        totalSubmissions,
        pendingSubmissions,
        totalClaims,
        pendingClaims,
        totalUsers,
        totalResearchers,
        totalPublishers,
        totalAdmins,
        totalForumTopics,
        totalForumReplies,
        totalPosts,
        totalJournalComments,
        scopusJournals,
        wosJournals
      },
      submissions,
      claims,
      journals,
      forumTopics,
      posts,
      comments,
      users,
      payments
    });
  } catch (error: any) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch admin overview data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // -------------------------------------------------------------
    // Action 1: Update Submission Status
    // -------------------------------------------------------------
    if (action === "updateSubmission") {
      const { submissionId, status, reviewNotes, qualityGrade } = body;
      if (!submissionId || !status) {
        return NextResponse.json({ success: false, error: "submissionId and status are required." }, { status: 400 });
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { journal: true }
      });

      if (!submission) {
        return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
      }

      const updated = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          evaluationLog: reviewNotes
            ? `${submission.evaluationLog || ""}\n[Editorial Note]: ${reviewNotes}`
            : submission.evaluationLog
        }
      });

      // If accepted, index the journal if linked, or create one if missing
      if (status === "ACCEPTED") {
        if (submission.journalId) {
          await prisma.journal.update({
            where: { id: submission.journalId },
            data: {
              isIndexed: true,
              indexedAt: new Date(),
              qualityGrade: qualityGrade || submission.journal?.qualityGrade || "A"
            }
          });
        } else {
          const newJournal = await prisma.journal.create({
            data: {
              name: submission.journalName,
              issn: submission.issn,
              eissn: submission.eissn,
              publisherName: submission.publisherName || "Pan-African Press",
              country: submission.country || "Pan-African",
              websiteUrl: submission.websiteUrl || "",
              description: submission.description || "African peer-reviewed journal.",
              frequency: submission.frequency || "Quarterly",
              isIndexed: true,
              indexedAt: new Date(),
              qualityGrade: qualityGrade || "A",
              publisherId: submission.submitterId
            }
          });

          await prisma.submission.update({
            where: { id: submissionId },
            data: { journalId: newJournal.id }
          });
        }
      } else if (status === "REJECTED" && submission.journalId) {
        await prisma.journal.update({
          where: { id: submission.journalId },
          data: { isIndexed: false }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Submission status updated to ${status}.`,
        submission: updated
      });
    }

    // -------------------------------------------------------------
    // Action 2: Update Publication Claim
    // -------------------------------------------------------------
    if (action === "updateClaim") {
      const { claimId, status } = body;
      if (!claimId || !status) {
        return NextResponse.json({ success: false, error: "claimId and status are required." }, { status: 400 });
      }

      const updated = await prisma.claimedPublication.update({
        where: { id: claimId },
        data: { status }
      });

      return NextResponse.json({
        success: true,
        message: `Publication claim marked as ${status}.`,
        claim: updated
      });
    }

    // -------------------------------------------------------------
    // Action 3: Quick Journal Updates
    // -------------------------------------------------------------
    if (action === "updateJournal") {
      const { journalId, isIndexed, certificatePaid, isScopusIndexed, isWosIndexed, qualityGrade, activeTier, publisherId, name, country } = body;
      if (!journalId) {
        return NextResponse.json({ success: false, error: "journalId is required." }, { status: 400 });
      }

      const dataToUpdate: any = {};
      if (typeof isIndexed === "boolean") {
        dataToUpdate.isIndexed = isIndexed;
        if (isIndexed) dataToUpdate.indexedAt = new Date();
      }
      if (typeof certificatePaid === "boolean") {
        dataToUpdate.certificatePaid = certificatePaid;
      }
      if (typeof isScopusIndexed === "boolean") {
        dataToUpdate.isScopusIndexed = isScopusIndexed;
      }
      if (typeof isWosIndexed === "boolean") {
        dataToUpdate.isWosIndexed = isWosIndexed;
      }
      if (qualityGrade !== undefined) {
        dataToUpdate.qualityGrade = qualityGrade;
      }
      if (activeTier !== undefined) {
        dataToUpdate.activeTier = activeTier;
      }
      if (publisherId !== undefined) {
        dataToUpdate.publisherId = publisherId || null;
      }
      if (name) dataToUpdate.name = name;
      if (country) dataToUpdate.country = country;

      const updated = await prisma.journal.update({
        where: { id: journalId },
        data: dataToUpdate
      });

      return NextResponse.json({
        success: true,
        message: `Journal "${updated.name}" updated successfully.`,
        journal: updated
      });
    }

    // -------------------------------------------------------------
    // Action 4: Moderate Forum Topic (Pin, Lock, Delete)
    // -------------------------------------------------------------
    if (action === "moderateForumTopic") {
      const { topicId, subAction } = body;
      if (!topicId || !subAction) {
        return NextResponse.json({ success: false, error: "topicId and subAction are required." }, { status: 400 });
      }

      if (subAction === "pin") {
        await prisma.forumTopic.update({ where: { id: topicId }, data: { isPinned: true } });
        return NextResponse.json({ success: true, message: "Forum topic pinned successfully." });
      }
      if (subAction === "unpin") {
        await prisma.forumTopic.update({ where: { id: topicId }, data: { isPinned: false } });
        return NextResponse.json({ success: true, message: "Forum topic unpinned successfully." });
      }
      if (subAction === "lock") {
        await prisma.forumTopic.update({ where: { id: topicId }, data: { isLocked: true } });
        return NextResponse.json({ success: true, message: "Forum topic locked successfully." });
      }
      if (subAction === "unlock") {
        await prisma.forumTopic.update({ where: { id: topicId }, data: { isLocked: false } });
        return NextResponse.json({ success: true, message: "Forum topic unlocked successfully." });
      }
      if (subAction === "delete") {
        await prisma.forumTopic.delete({ where: { id: topicId } });
        return NextResponse.json({ success: true, message: "Forum topic deleted successfully." });
      }
    }

    // -------------------------------------------------------------
    // Action 5: Delete Forum Reply
    // -------------------------------------------------------------
    if (action === "deleteForumReply") {
      const { replyId } = body;
      if (!replyId) return NextResponse.json({ success: false, error: "replyId is required." }, { status: 400 });
      await prisma.forumReply.delete({ where: { id: replyId } });
      return NextResponse.json({ success: true, message: "Forum reply deleted." });
    }

    // -------------------------------------------------------------
    // Action 6: Moderate Scholar Social Post (Delete)
    // -------------------------------------------------------------
    if (action === "moderatePost") {
      const { postId } = body;
      if (!postId) return NextResponse.json({ success: false, error: "postId is required." }, { status: 400 });
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ success: true, message: "Post and associated comments removed." });
    }

    // -------------------------------------------------------------
    // Action 7: Delete Post Comment
    // -------------------------------------------------------------
    if (action === "deletePostComment") {
      const { commentId } = body;
      if (!commentId) return NextResponse.json({ success: false, error: "commentId is required." }, { status: 400 });
      await prisma.postComment.delete({ where: { id: commentId } });
      return NextResponse.json({ success: true, message: "Comment deleted." });
    }

    // -------------------------------------------------------------
    // Action 8: Delete Journal Comment
    // -------------------------------------------------------------
    if (action === "deleteJournalComment") {
      const { commentId } = body;
      if (!commentId) return NextResponse.json({ success: false, error: "commentId is required." }, { status: 400 });
      await prisma.comment.delete({ where: { id: commentId } });
      return NextResponse.json({ success: true, message: "Journal comment deleted." });
    }

    // -------------------------------------------------------------
    // Action 9: Update User Role & Permissions
    // -------------------------------------------------------------
    if (action === "updateUserRole") {
      const { userId, newRole } = body;
      if (!userId || !["RESEARCHER", "PUBLISHER", "ADMIN"].includes(newRole)) {
        return NextResponse.json({ success: false, error: "Valid userId and role are required." }, { status: 400 });
      }

      // Safeguard master admin email
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      if (targetUser.email === "kenprokenya@gmail.com" && newRole !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Cannot demote primary Chief Administrator." }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, email: true, name: true, role: true }
      });

      return NextResponse.json({
        success: true,
        message: `User ${updated.email} role updated to ${newRole}.`,
        user: updated
      });
    }

    // -------------------------------------------------------------
    // Action 10: Delete User Account
    // -------------------------------------------------------------
    if (action === "deleteUser") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      if (targetUser.email === "kenprokenya@gmail.com") {
        return NextResponse.json({ success: false, error: "Cannot delete master administrator." }, { status: 400 });
      }

      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: `User ${targetUser.email} account deleted.` });
    }

    // -------------------------------------------------------------
    // Action 11: Trigger OAI-PMH Harvest
    // -------------------------------------------------------------
    if (action === "triggerOaiHarvest") {
      const { oaiUrl, journalId, limit = 100, autoSave = true } = body;
      if (!oaiUrl) return NextResponse.json({ success: false, error: "oaiUrl is required." }, { status: 400 });

      const identify = await identifyOaiRepository(oaiUrl);
      if (!identify) {
        return NextResponse.json({ success: false, error: "Repository does not respond to OAI-PMH v2.0." }, { status: 422 });
      }

      const harvest = await harvestOaiRecords(oaiUrl, parseInt(limit, 10));
      if (!harvest.success) {
        return NextResponse.json({ success: false, error: harvest.error || "Harvest failed." }, { status: 500 });
      }

      let savedCount = 0;
      if (autoSave && journalId && harvest.records.length > 0) {
        for (const rec of harvest.records) {
          try {
            const doi = rec.doi ? rec.doi.trim() : null;
            if (doi) {
              const existing = await prisma.article.findUnique({ where: { doi } });
              if (!existing) {
                await prisma.article.create({
                  data: {
                    title: rec.title,
                    doi,
                    abstract: rec.description || null,
                    pdfUrl: rec.url || null,
                    publishDate: new Date(rec.publishDate || Date.now()),
                    journalId
                  }
                });
                savedCount++;
              }
            } else {
              await prisma.article.create({
                data: {
                  title: rec.title,
                  doi: null,
                  abstract: rec.description || null,
                  pdfUrl: rec.url || null,
                  publishDate: new Date(rec.publishDate || Date.now()),
                  journalId
                }
              });
              savedCount++;
            }
          } catch {
            // Skip duplicates
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Harvested ${harvest.records.length} records. Saved ${savedCount} new articles to journal catalog.`,
        recordsCount: harvest.records.length,
        savedCount
      });
    }

    // -------------------------------------------------------------
    // Action 12: Trigger Metrics Recalculation
    // -------------------------------------------------------------
    if (action === "triggerMetricsRecalculation") {
      const journals = await prisma.journal.findMany({
        include: {
          articles: {
            select: {
              id: true,
              citedBy: { select: { id: true } }
            }
          }
        }
      });

      const calculatedList = journals.map(journal => {
        const articleCount = journal.articles.length;
        let citationCount = 0;
        journal.articles.forEach(art => {
          citationCount += art.citedBy.length;
        });

        const standardScore = articleCount > 0 ? parseFloat((citationCount / articleCount).toFixed(3)) : 0.0;
        const regionalScore = parseFloat((standardScore * 1.15).toFixed(3));
        const disciplines = getDisciplines(journal.name, journal.description || "");
        const primaryDiscipline = disciplines[0] || "Multidisciplinary";

        return {
          journalId: journal.id,
          name: journal.name,
          articleCount,
          citationCount,
          standardScore,
          regionalScore,
          score: standardScore,
          primaryDiscipline
        };
      });

      const disciplineGroups: Record<string, typeof calculatedList> = {};
      calculatedList.forEach(item => {
        if (!disciplineGroups[item.primaryDiscipline]) {
          disciplineGroups[item.primaryDiscipline] = [];
        }
        disciplineGroups[item.primaryDiscipline].push(item);
      });

      const finalRankings: any[] = [];
      Object.keys(disciplineGroups).forEach(disc => {
        const withQuartiles = assignQuartiles(disciplineGroups[disc]);
        finalRankings.push(...withQuartiles);
      });

      return NextResponse.json({
        success: true,
        message: `Recalculated metrics for ${finalRankings.length} journals successfully.`,
        processedJournals: finalRankings.length
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Admin POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute admin action." },
      { status: 500 }
    );
  }
}
