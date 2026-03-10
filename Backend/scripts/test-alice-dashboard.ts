import axios from 'axios';

async function testAliceDashboard() {
  try {
    console.log("🧪 Testing Alice's dashboard API...\n");

    // 1. Login
    console.log("1️⃣ Logging in...");
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'alice@yzone.com',
      password: 'student123'
    });

    if (!loginResponse.data.success) {
      console.error("❌ Login failed:", loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log("✅ Login successful");
    if (token) {
      console.log(`Token: ${token.substring(0, 20)}...`);
    } else {
      console.log("⚠️  No token in response");
      console.log("Response:", JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    // 2. Get Dashboard
    console.log("\n2️⃣ Fetching dashboard...");
    const dashboardResponse = await axios.get('http://localhost:5000/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!dashboardResponse.data.success) {
      console.error("❌ Dashboard fetch failed:", dashboardResponse.data.message);
      return;
    }

    const data = dashboardResponse.data.data;
    console.log("✅ Dashboard loaded successfully\n");

    // 3. Display Data
    console.log("📊 DASHBOARD DATA:");
    console.log("==================");
    
    console.log("\n📈 Tracker Stats:");
    console.log(`  - Total Entries: ${data.trackerStats?.total_entries || 0}`);
    console.log(`  - This Week: ${data.trackerStats?.this_week || 0}`);
    console.log(`  - This Month: ${data.trackerStats?.this_month || 0}`);

    console.log("\n🏆 Leaderboard Rank:");
    console.log(`  - Rank: ${data.leaderboardRank?.rank || 'N/A'}`);
    console.log(`  - Total Score: ${data.leaderboardRank?.total_score || 0}`);

    console.log("\n📝 Recent Trackers: ${data.recentTrackers?.length || 0} entries");
    if (data.recentTrackers && data.recentTrackers.length > 0) {
      data.recentTrackers.slice(0, 3).forEach((tracker: any, i: number) => {
        console.log(`  ${i + 1}. ${tracker.entry_date} - ${tracker.hours_spent}h`);
      });
    }

    console.log(`\n🔔 Notifications: ${data.notifications?.length || 0} entries`);
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.slice(0, 3).forEach((notif: any, i: number) => {
        console.log(`  ${i + 1}. ${notif.title} - ${notif.is_read ? 'Read' : 'Unread'}`);
      });
    }

    console.log(`\n👨‍💼 Mentor Feedback: ${data.mentorFeedback?.length || 0} reviews`);
    if (data.mentorFeedback && data.mentorFeedback.length > 0) {
      data.mentorFeedback.forEach((feedback: any, i: number) => {
        console.log(`  ${i + 1}. ${feedback.mentor_name} - Rating: ${feedback.rating}/5`);
      });
    }

    console.log(`\n👨‍🏫 Faculty Feedback: ${data.facultyFeedback?.length || 0} reviews`);
    if (data.facultyFeedback && data.facultyFeedback.length > 0) {
      data.facultyFeedback.forEach((feedback: any, i: number) => {
        console.log(`  ${i + 1}. ${feedback.faculty_name} - Academic: ${feedback.academic_rating}/5`);
      });
    }

    console.log(`\n🏅 Top Leaderboard: ${data.topLeaderboard?.length || 0} students`);
    if (data.topLeaderboard && data.topLeaderboard.length > 0) {
      data.topLeaderboard.slice(0, 5).forEach((student: any) => {
        console.log(`  ${student.rank}. ${student.student_name} - ${student.total_score}`);
      });
    }

    console.log(`\n📁 Projects: ${data.projects?.length || 0} assigned`);
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach((project: any, i: number) => {
        console.log(`  ${i + 1}. ${project.title} - ${project.status}`);
      });
    }

    console.log("\n✅ All data retrieved successfully!");

  } catch (error: any) {
    console.error("\n❌ Error:", error.response?.data || error.message);
  }
}

testAliceDashboard();
