import { Network, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  product: {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#features" },
      { label: "Harga", href: "#pricing" },
      { label: "Integrasi", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  company: {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Karir", href: "#" },
      { label: "Kontak", href: "#" },
    ],
  },
  support: {
    title: "Bantuan",
    links: [
      { label: "Dokumentasi", href: "#" },
      { label: "Tutorial", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Syarat & Ketentuan", href: "#" },
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Refund Policy", href: "#" },
    ],
  },
};

const Footer = () => {
  return (
    <footer className="bg-[hsl(222_47%_11%)] text-[hsl(210_40%_98%)] py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">
                NetManage
              </span>
            </a>
            <p className="text-[hsl(210_40%_98%/0.7)] mb-6 max-w-sm">
              Platform manajemen RT RW Net terlengkap di Indonesia. Kelola pelanggan, 
              billing, dan monitoring jaringan dalam satu dashboard.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[hsl(210_40%_98%/0.7)]">
                <Mail className="w-4 h-4" />
                <span className="text-sm">halo@netmanage.id</span>
              </div>
              <div className="flex items-center gap-3 text-[hsl(210_40%_98%/0.7)]">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-3 text-[hsl(210_40%_98%/0.7)]">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Jakarta, Indonesia</span>
              </div>
            </div>
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[hsl(210_40%_98%/0.7)] hover:text-[hsl(210_40%_98%)] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[hsl(210_40%_98%/0.1)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[hsl(210_40%_98%/0.5)]">
              © 2024 NetManage. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-[hsl(210_40%_98%/0.5)]">
                Dibuat dengan ❤️ di Indonesia
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
