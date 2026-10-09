import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Today from './pages/Today.jsx';
import StudentsList from './pages/students/StudentsList.jsx';
import StudentProfile from './pages/students/StudentProfile.jsx';
import AddStudent from './pages/students/AddStudent.jsx';
import Families from './pages/students/Families.jsx';
import FamilyProfile from './pages/students/FamilyProfile.jsx';
import AddFamily from './pages/students/AddFamily.jsx';
import Admissions from './pages/students/Admissions.jsx';
import StaffList from './pages/staff/StaffList.jsx';
import StaffProfile from './pages/staff/StaffProfile.jsx';
import AddStaff from './pages/staff/AddStaff.jsx';
import Payroll from './pages/staff/Payroll.jsx';
import StaffAttendance from './pages/staff/StaffAttendance.jsx';
import Attendance from './pages/academics/Attendance.jsx';
import Classes from './pages/academics/Classes.jsx';
import ClassPage from './pages/academics/ClassPage.jsx';
import Timetable from './pages/academics/Timetable.jsx';
import Exams from './pages/academics/Exams.jsx';
import ExamResults from './pages/academics/ExamResults.jsx';
import Diary from './pages/academics/Diary.jsx';
import Observations from './pages/academics/Observations.jsx';
import Analytics from './pages/finance/Analytics.jsx';
import FeeCollect from './pages/finance/FeeCollect.jsx';
import Fees from './pages/finance/Fees.jsx';
import Transactions from './pages/finance/Transactions.jsx';
import Accounts from './pages/finance/Accounts.jsx';
import Messages from './pages/engage/Messages.jsx';
import Chat from './pages/engage/Chat.jsx';
import Site from './pages/website/Site.jsx';
import Documents from './pages/website/Documents.jsx';
import Reports from './pages/Reports.jsx';
import ReportView from './pages/ReportView.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

// Marketing site + sign-up, outside the app shell.
const SiteHome = lazy(() => import('./site/Home.jsx'));
const SignUp = lazy(() => import('./site/SignUp.jsx'));
const site = (el) => <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A0B09' }} />}>{el}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route path="site" element={site(<SiteHome />)} />
      <Route path="sign-up" element={site(<SignUp />)} />
      <Route element={<Shell />}>
        <Route index element={<Today />} />

        <Route path="students" element={<StudentsList />} />
        <Route path="students/new" element={<AddStudent />} />
        <Route path="students/families" element={<Families />} />
        <Route path="students/families/new" element={<AddFamily />} />
        <Route path="students/families/:id" element={<FamilyProfile />} />
        <Route path="students/admissions" element={<Admissions />} />
        <Route path="students/:id" element={<StudentProfile />} />

        <Route path="staff" element={<StaffList />} />
        <Route path="staff/new" element={<AddStaff />} />
        <Route path="staff/payroll" element={<Payroll />} />
        <Route path="staff/attendance" element={<Navigate to="/academics/attendance/staff" replace />} />
        <Route path="staff/:id" element={<StaffProfile />} />

        <Route path="academics" element={<Navigate to="/academics/attendance" replace />} />
        <Route path="academics/attendance" element={<Attendance />} />
        <Route path="academics/attendance/staff" element={<StaffAttendance />} />
        <Route path="academics/classes" element={<Classes />} />
        <Route path="academics/classes/:id" element={<ClassPage />} />
        <Route path="academics/timetable" element={<Timetable />} />
        <Route path="academics/exams" element={<Exams />} />
        <Route path="academics/exams/:id" element={<ExamResults />} />
        <Route path="academics/diary" element={<Diary />} />
        <Route path="academics/observations" element={<Observations />} />

        <Route path="finance" element={<Navigate to="/finance/fees" replace />} />
        <Route path="finance/fees" element={<Fees />} />
        <Route path="finance/fees/:id" element={<FeeCollect />} />
        <Route path="finance/transactions" element={<Transactions />} />
        <Route path="finance/accounts" element={<Accounts />} />
        <Route path="finance/analytics" element={<Analytics />} />

        <Route path="engage" element={<Navigate to="/engage/messages" replace />} />
        <Route path="engage/messages" element={<Messages />} />
        <Route path="engage/chat" element={<Chat />} />

        <Route path="website" element={<Navigate to="/website/site" replace />} />
        <Route path="website/site" element={<Site />} />
        <Route path="website/documents" element={<Documents />} />

        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportView />} />

        <Route path="settings" element={<Settings />} />
        <Route path="settings/:section" element={<Settings />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
