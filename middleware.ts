import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Check if the route is protected
    const path = request.nextUrl.pathname;
    const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/therapy');

    if (isProtectedRoute) {
        // 2. Check for auth cookie
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            // 3. Redirect to login if missing
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/therapy/:path*'],
};
