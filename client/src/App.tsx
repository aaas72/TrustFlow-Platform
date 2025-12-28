import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/shared/Login";
import Register from "./pages/shared/Register";
import Landing from "./pages/shared/Landing";
import ClientLayout from "./pages/client/ClientLayout";
import Dashboard from "./pages/client/Dashboard";
import CreateProject from "./pages/client/CreateProject";
import Projects from "./pages/client/Projects";
import Payments from "./pages/client/Payments";

import UpdateProject from "./pages/client/UpdateProject";
import ClientProjectDetailRoute from "./pages/client/ProjectDetailRoute";
import ClientMilestonesTab from "./pages/client/MilestonesTab";
import ClientRequestRevisionPage from "./pages/client/RequestRevision";
import ClientPlanTab from "./pages/client/PlanTab";
import ClientOverviewTab from "./pages/client/OverviewTab";
import ClientTimelineTab from "./pages/client/TimelineTab";
import ClientPaymentsTab from "./pages/client/PaymentsTab";
import ClientReviewsTab from "./pages/client/ReviewsTab";
import FreelancerLayout from "./pages/freelancer/FreelancerLayout";
import FLDashboard from "./pages/freelancer/Dashboard";
import FLAvailable from "./pages/freelancer/Available";
import FLCurrent from "./pages/freelancer/Current";
import FLPast from "./pages/freelancer/Past";
import FLPayments from "./pages/freelancer/Payments";

import FLProjectDetailRoute from "./pages/freelancer/ProjectDetailRoute";
import OverviewTab from "./pages/freelancer/OverviewTab";
import PlanTab from "./pages/freelancer/PlanTab";
import MilestonesTab from "./pages/freelancer/MilestonesTab";
import TimelineTab from "./pages/freelancer/TimelineTab";
import PaymentsTab from "./pages/freelancer/PaymentsTab";
import FreelancerReviewsTab from "./pages/freelancer/ReviewsTab";
import SubmitMilestonePage from "./pages/freelancer/SubmitMilestone";
import AdminPage from "./pages/admin/AdminPage";
import { HealthCheck, GlobalLoader } from "./components";
import { ToastProvider } from "./context/ToastContext";



function App() {
  return (
    <ToastProvider>
      <Router>
        <div>
          {/* Global loader: shows for any active network request */}
          <GlobalLoader />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/client/*" element={<ClientLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="create" element={<CreateProject />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id/edit" element={<UpdateProject />} />
              <Route
                path="projects/:id/*"
                element={<ClientProjectDetailRoute />}
              >
                <Route index element={<ClientOverviewTab />} />
                <Route path="plan" element={<ClientPlanTab />} />
                <Route path="milestones" element={<ClientMilestonesTab />} />
                <Route path="timeline" element={<ClientTimelineTab />} />
                <Route path="payments" element={<ClientPaymentsTab />} />
                <Route path="reviews" element={<ClientReviewsTab />} />
                <Route
                  path="milestones/:mid/revision"
                  element={<ClientRequestRevisionPage />}
                />
              </Route>{" "}
              <Route path="payments" element={<Payments />} />
            </Route>
            <Route path="/freelancer/*" element={<FreelancerLayout />}>
              <Route index element={<FLDashboard />} />
              <Route path="dashboard" element={<FLDashboard />} />
              <Route path="available" element={<FLAvailable />} />
              <Route path="current" element={<FLCurrent />} />
              <Route path="projects/:id/*" element={<FLProjectDetailRoute />}>
                <Route index element={<OverviewTab />} />
                <Route path="plan" element={<PlanTab />} />
                <Route path="milestones" element={<MilestonesTab />} />
                <Route
                  path="milestones/:mid/submit"
                  element={<SubmitMilestonePage />}
                />
                <Route path="timeline" element={<TimelineTab />} />
                <Route path="payments" element={<PaymentsTab />} />
                <Route path="reviews" element={<FreelancerReviewsTab />} />
              </Route>
              <Route path="past" element={<FLPast />} />
              <Route path="payments" element={<FLPayments />} />
            </Route>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {/* Yüzen bağlantı kontrol düğmesi */}
          <HealthCheck />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
