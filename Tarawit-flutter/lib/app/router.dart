import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_page.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/biometric_setup_page.dart';
import '../features/auth/pin_setup_page.dart';
import '../features/auth/pin_entry_page.dart';
import '../features/attendance/attendance_page.dart';
import '../features/dashboard/dashboard_page.dart';
import '../features/evaluation/evaluation_page.dart';
import '../features/evaluation/my_tasks_page.dart';
import '../features/evaluation/my_results_page.dart';
import '../features/evaluation/my_result_detail_page.dart';
import '../features/evaluation/score_assignment_page.dart';
import '../features/modules/module_page.dart';
import '../features/profile/profile_page.dart';
import '../features/splash/splash_page.dart';
import '../shared/app_shell.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final auth = AuthController.instance;
    final location = state.matchedLocation;
    final isPublic = location == '/' || location == '/login';
    if (auth.status == AuthStatus.checking && location != '/') return '/';
    if (auth.status == AuthStatus.unauthenticated && !isPublic) return '/login';
    if (auth.status == AuthStatus.authenticated && location == '/login') {
      return '/dashboard';
    }
    return null;
  },
  errorBuilder: (context, state) => Scaffold(
    body: Center(child: Text('ไม่พบหน้า ${state.uri.path}')),
  ),
  routes: [
    GoRoute(
      path: '/',
      name: 'splash',
      builder: (context, state) => const SplashPage(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/biometric-setup',
      name: 'biometric-setup',
      builder: (context, state) => const BiometricSetupPage(),
    ),
    GoRoute(
      path: '/pin-setup',
      name: 'pin-setup',
      builder: (context, state) => const PinSetupPage(),
    ),
    GoRoute(
      path: '/pin-entry',
      name: 'pin-entry',
      builder: (context, state) => const PinEntryPage(),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) => AppShell(
        navigationShell: navigationShell,
      ),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/dashboard',
              name: 'dashboard',
              builder: (context, state) => const DashboardPage(),
              routes: [
                GoRoute(
                  path: 'attendance',
                  name: 'attendance',
                  builder: (context, state) => const AttendancePage(),
                ),
                GoRoute(
                  path: 'evaluation',
                  name: 'evaluation',
                  builder: (context, state) => const EvaluationPage(),
                ),
                GoRoute(
                  path: 'my-tasks',
                  name: 'my-tasks',
                  builder: (context, state) => const MyTasksPage(),
                ),
                GoRoute(
                  path: 'my-results',
                  name: 'my-results',
                  builder: (context, state) => const MyResultsPage(),
                ),
                GoRoute(
                  path: 'my-results/:id',
                  name: 'my-result-detail',
                  builder: (context, state) => MyResultDetailPage(
                    instanceId: int.parse(state.pathParameters['id']!),
                  ),
                ),
                GoRoute(
                  path: 'score/:assignmentId',
                  name: 'score-assignment',
                  builder: (context, state) => ScoreAssignmentPage(
                    assignmentId: int.parse(state.pathParameters['assignmentId']!),
                  ),
                ),
                GoRoute(
                  path: 'module/:moduleId',
                  name: 'module',
                  builder: (context, state) => ModulePage(
                    moduleId: state.pathParameters['moduleId']!,
                  ),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              name: 'profile',
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
      ],
    ),
  ],
);
