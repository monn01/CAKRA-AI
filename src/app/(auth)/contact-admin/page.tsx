import { GraduationCap, Phone, Mail, User } from "lucide-react";
import { ContactAdminForm } from "@/components/auth/ContactAdminForm";

export default function ContactAdminPage() {
  const adminName = process.env.SCHOOL_ADMIN_NAME;
  const adminPhone = process.env.SCHOOL_ADMIN_PHONE;
  const adminEmail = process.env.SCHOOL_ADMIN_EMAIL;
  const hasContactInfo = Boolean(adminName || adminPhone || adminEmail);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream px-4 py-16">
      <div className="absolute -top-32 -left-32 size-64 rounded-br-full bg-brand-cream-alt opacity-30" />
      <div className="absolute -bottom-24 -right-32 size-96 rounded-tl-full bg-brand opacity-10" />

      <div className="relative flex w-full max-w-[500px] flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="size-6 text-brand" strokeWidth={2.25} />
            <h1 className="font-serif text-3xl font-bold text-brand">Inovasi CAKRA</h1>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Hubungi Admin Sekolah</h2>
          <p className="text-base text-brand-muted">
            Kendala teknis, akses akun, atau pertanyaan lain seputar CAKRA-AI.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-brand-card p-8 shadow-sm">
          {hasContactInfo ? (
            <div className="mb-6 flex flex-col gap-2 rounded-lg border border-black/10 bg-brand-cream-alt p-4 text-sm">
              {adminName && (
                <div className="flex items-center gap-2 text-brand-dark">
                  <User className="size-3.5 text-brand-muted" />
                  {adminName}
                </div>
              )}
              {adminPhone && (
                <div className="flex items-center gap-2 text-brand-dark">
                  <Phone className="size-3.5 text-brand-muted" />
                  {adminPhone}
                </div>
              )}
              {adminEmail && (
                <div className="flex items-center gap-2 text-brand-dark">
                  <Mail className="size-3.5 text-brand-muted" />
                  {adminEmail}
                </div>
              )}
            </div>
          ) : (
            <p className="mb-6 rounded-lg border border-dashed border-black/20 p-4 text-center text-sm text-brand-muted">
              Kontak langsung admin sekolah belum dikonfigurasi. Kirim pesan lewat form di bawah,
              atau tanyakan langsung ke pengelola sistem di sekolah Anda.
            </p>
          )}

          <ContactAdminForm />
        </div>
      </div>
    </main>
  );
}
