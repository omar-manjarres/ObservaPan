import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import {
  LoginPage, ForgotPasswordPage, RegisterPage, DashboardPage, BakeriesPage, BakeryDetailPage,
  BakeryFormPage, UsersPage, FormsPage, FormBuilderPage, NewRecordPage, RecordsPage,
  RecordDetailPage, IndicatorsPage, ComparisonsPage, AlertsPage, ReportsPage,
  SettingsPage, AuditPage, NotFoundPage,
} from "@/pages";

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />

          <Route path={ROUTES.bakeries} element={<BakeriesPage />} />
          <Route path={ROUTES.newBakery} element={<RoleGuard roles={["admin"]}><BakeryFormPage /></RoleGuard>} />
          <Route path={ROUTES.editBakery()} element={<RoleGuard roles={["admin"]}><BakeryFormPage /></RoleGuard>} />
          <Route path={ROUTES.bakeryDetail()} element={<BakeryDetailPage />} />

          <Route path={ROUTES.records} element={<RecordsPage />} />
          <Route path={ROUTES.newRecord} element={<RoleGuard roles={["admin", "surveyor", "bakery"]}><NewRecordPage /></RoleGuard>} />
          <Route path={ROUTES.recordDetail()} element={<RecordDetailPage />} />

          <Route path={ROUTES.indicators} element={<IndicatorsPage />} />
          <Route path={ROUTES.comparisons} element={<ComparisonsPage />} />
          <Route path={ROUTES.alerts} element={<AlertsPage />} />
          <Route path={ROUTES.reports} element={<RoleGuard roles={["admin", "consultant", "bakery"]}><ReportsPage /></RoleGuard>} />

          <Route path={ROUTES.forms} element={<RoleGuard roles={["admin"]}><FormsPage /></RoleGuard>} />
          <Route path={ROUTES.newForm} element={<RoleGuard roles={["admin"]}><FormsPage /></RoleGuard>} />
          <Route path={ROUTES.editForm()} element={<RoleGuard roles={["admin"]}><FormBuilderPage /></RoleGuard>} />

          <Route path={ROUTES.users} element={<RoleGuard roles={["admin"]}><UsersPage /></RoleGuard>} />
          <Route path={ROUTES.audit} element={<RoleGuard roles={["admin"]}><AuditPage /></RoleGuard>} />
          <Route path={ROUTES.settings} element={<RoleGuard roles={["admin"]}><SettingsPage /></RoleGuard>} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
