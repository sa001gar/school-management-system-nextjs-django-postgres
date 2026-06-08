import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/teacher': ['admin', 'teacher'],
  '/student': ['student'],
};

const publicRoutes = [
  '/login',
  '/login/admin',
  '/login/teacher',
  '/login/student',
  '/',
];

const staticPatterns = ['/_next', '/api', '/favicon.ico', '/manifest.json', '/robots.txt'];

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return Date.now() >= payload.exp * 1000 - 60000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (staticPatterns.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const hasValidToken = accessToken && !isTokenExpired(accessToken);

  const isPublicRoute = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const isProtectedRoute = Object.keys(protectedRoutes).some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (hasValidToken && pathname.includes('/login')) {
    if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (userRole === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
    if (userRole === 'student') return NextResponse.redirect(new URL('/student', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute) return NextResponse.next();

  if (!isProtectedRoute) return NextResponse.next();

  if (!hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (accessToken && isTokenExpired(accessToken)) {
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('user_role');
    }
    return response;
  }

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        if (userRole === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
        if (userRole === 'student') return NextResponse.redirect(new URL('/student', request.url));
        return NextResponse.redirect(new URL('/login', request.url));
      }
      break;
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'],
};
