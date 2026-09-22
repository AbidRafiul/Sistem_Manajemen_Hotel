/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File untuk konfigurasi dan tools terkait autentikasi next auth
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */

import NextAuth, { CredentialsSignin, NextAuthConfig, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { refreshToken } from '@/lib/tools/serverTools'; // Pastikan path import ini benar

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!secret) {
    console.warn("⚠️ PERINGATAN: AUTH_SECRET belum didefinisikan di environment variables (.env). NextAuth v5 sangat merekomendasikan penggunaan AUTH_SECRET.");
}

const authOptions: NextAuthConfig = {
    secret: secret,
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                userData: { label: 'User Data', type: 'text' }
            },
            async authorize(credentials): Promise<any> {
                try {
                    if (!credentials.userData) {
                        throw new CredentialsSignin();
                    }
                    const userData = JSON.parse(credentials.userData as string);
                    return userData;
                } catch (error: any) {
                    console.error('Auth error:', error);
                    throw new CredentialsSignin();
                }
            }
        }),
    ],
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
        signOut: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: { token: JWT; user?: User; trigger?: "signIn" | "signUp" | "update"; session?: any }) {
            // 0. Update session saat trigger update (misal switch branch)
            if (trigger === "update" && session) {
                if (session.access_token) token.access_token = session.access_token;
                if (session.refresh_token) token.refresh_token = session.refresh_token;
                if (session.active_branch) {
                    token.active_branch_id = session.active_branch.id;
                    token.active_kode_cabang = session.active_branch.kode_cabang;
                    token.active_branch_name = session.active_branch.nama_hotel;
                }
                if (session.user) {
                    if (session.user.active_branch_id) token.active_branch_id = session.user.active_branch_id;
                    if (session.user.active_kode_cabang) token.active_kode_cabang = session.user.active_kode_cabang;
                    if (session.user.active_branch_name) token.active_branch_name = session.user.active_branch_name;
                }
                return token;
            }

            // 1. Initial sign in (Pertama kali login)
            if (user) {
                const u = user as any;
                token.id = u.user_info?.id || u.id;
                token.role = u.user_info?.role || u.role;
                token.user_code = u.user_info?.user_code || u.user_code;
                token.name = u.user_info?.fullname || u.name;
                token.username = u.user_info?.username || u.username;
                token.remember_me = u.remember_me;

                token.access_token = u.access_token;
                token.refresh_token = u.refresh_token;

                // Enterprise Branch Context
                token.company_id = u.company_id ?? u.user_info?.company_id;
                token.company_name = u.company_name ?? u.user_info?.company_name;
                token.company_code = u.company_code ?? u.user_info?.company_code;
                token.default_branch_id = u.default_branch_id ?? u.user_info?.default_branch_id;
                token.default_kode_cabang = u.default_kode_cabang ?? u.user_info?.default_kode_cabang;
                token.default_branch_name = u.default_branch_name ?? u.user_info?.default_branch_name;
                token.active_branch_id = u.active_branch_id ?? u.user_info?.active_branch_id;
                token.active_kode_cabang = u.active_kode_cabang ?? u.user_info?.active_kode_cabang;
                token.active_branch_name = u.active_branch_name ?? u.user_info?.active_branch_name;
                token.allowed_branches = u.allowed_branches ?? u.user_info?.allowed_branches ?? [];
                token.allowed_kode_cabang = u.allowed_kode_cabang ?? u.user_info?.allowed_kode_cabang ?? [];
                token.can_switch_branch = u.can_switch_branch ?? u.user_info?.can_switch_branch ?? false;

                const expireDurationInSeconds = u.remember_me === '1' || u.remember_me === true ? (24 * 60 * 60) : (7 * 60 * 60);
                token.access_token_expires = Math.floor(Date.now() / 1000) + expireDurationInSeconds - 120;

                return token;
            }

            // 2. Saat user bernavigasi / melakukan request API
            const now = Math.floor(Date.now() / 1000);
            if (token.access_token_expires && now > token.access_token_expires) {
                try {
                    const refreshedTokens = await refreshToken(
                        token.user_code || token.id || '',
                        token.refresh_token || '',
                        token.remember_me ? '1' : '0'
                    );

                    // Perbarui token di dalam cookie NextAuth
                    token.access_token = refreshedTokens.access_token;
                    token.refresh_token = refreshedTokens.refresh_token ?? token.refresh_token;

                    const expireDurationInSeconds = token.remember_me ? (24 * 60 * 60) : (7 * 60 * 60);
                    token.access_token_expires = Math.floor(Date.now() / 1000) + expireDurationInSeconds - 120;

                    delete token.error;
                } catch (error: any) {
                    console.warn("Gagal melakukan refresh token:", error?.response?.data?.message || error.message);
                    token.error = "AccessTokenExpired";
                }
            }

            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.user_code = token.user_code;
            session.user.name = token.name;
            session.user.username = token.username;
            session.remember_me = token.remember_me;

            session.user.company_id = token.company_id;
            session.user.company_name = token.company_name;
            session.user.company_code = token.company_code;
            session.user.default_branch_id = token.default_branch_id;
            session.user.default_kode_cabang = token.default_kode_cabang;
            session.user.default_branch_name = token.default_branch_name;
            session.user.active_branch_id = token.active_branch_id;
            session.user.active_kode_cabang = token.active_kode_cabang;
            session.user.active_branch_name = token.active_branch_name;
            session.user.allowed_branches = token.allowed_branches;
            session.user.allowed_kode_cabang = token.allowed_kode_cabang;
            session.user.can_switch_branch = token.can_switch_branch;

            session.access_token = token.access_token;
            session.refresh_token = token.refresh_token;
            session.error = token.error;

            return session;
        },
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                // domain: 'localhost'
            }
        }
    },
    debug: process.env.NODE_ENV === 'development',
};

const { handlers, auth } = NextAuth(authOptions);

export { authOptions, handlers, auth };