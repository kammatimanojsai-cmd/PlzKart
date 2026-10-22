/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'pg', 'nodemailer', 'bcryptjs'],
  poweredByHeader: false,
};

export default nextConfig;
