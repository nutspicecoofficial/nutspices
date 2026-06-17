"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu, X, LogOut, AlertCircle, BookOpen, Briefcase } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import SearchModal from "./SearchModal";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

type NavItem = {
  id: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();


  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string | null; phoneNumber: string } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<{ name: string; slug: string }[]>([]);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  let closeTimeout: NodeJS.Timeout;

  // Cart store hydration handling
  const [cartCount, setCartCount] = useState(0);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/login") return;

    setCartCount(getTotalItems());

    // Sync cart with backend if user is logged in
    const syncCart = async () => {
      if (user && cartItems.length > 0) {
        try {
          await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cartItems }),
          });
        } catch (error) {
          console.error("Failed to sync cart", error);
        }
      }
    };

    const timeoutId = setTimeout(syncCart, 1000); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cartItems, getTotalItems, user, pathname]);

  useEffect(() => {
    const fetchData = async () => {
      if (pathname.startsWith("/admin") || pathname === "/login") return;

      try {
        // Fetch Nav Items
        const navRes = await fetch("/api/admin/nav");
        const navData = await navRes.json();
        if (navData.success) {
          setNavItems(navData.data);
        }

        // Fetch Session
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user);
        } else {
          setUser(null);
          // If the user is logged out, ensure the cart is empty
          if (cartItems.length > 0) {
            clearCart();
          }
        }

        // Fetch Collections (Carousel Names) - For all users
        const collRes = await fetch("/api/home/collections");
        const collData = await collRes.json();
        if (collData.success) {
          setCollections(collData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }

    };

    fetchData();
  }, [pathname, cartItems.length, clearCart]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        clearCart();
        setIsLogoutModalOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hide Navbar for Admin Portal and Login Page
  if (pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-brand border-b border-white/10 shadow-lg font-inter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-8">
              <Link href="/" className="transition-transform hover:scale-105 duration-300">
                <Image
                  src="/images/logo.png"
                  alt="NutspiceCo Logo"
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation (Dynamic from DB) */}
            <nav className="hidden lg:flex items-center space-x-6 mr-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 w-16 bg-white/10 rounded-full animate-pulse"></div>
                ))
              ) : (
                navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`text-[12px] font-bold tracking-[0.1em] transition-all duration-300 relative group py-1 whitespace-nowrap ${isActive ? "text-[#C5A059]" : "text-white hover:text-[#C5A059]"
                        }`}
                    >
                      {item.label}
                      <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#C5A059] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"
                        }`}></span>
                    </Link>
                  );
                })
              )}

              {/* Collections Dropdown */}
              <div
                className="relative group py-1"
                onMouseEnter={() => {
                  setIsCollectionsOpen(true);
                }}
                onMouseLeave={() => {
                  setTimeout(() => {
                    setIsCollectionsOpen(false);
                  }, 100);
                }}
              >
                <button
                  className={`text-[12px] font-bold tracking-[0.1em] transition-all duration-300 flex items-center gap-1 ${isCollectionsOpen ? "text-[#C5A059]" : "text-white hover:text-[#C5A059]"
                    }`}
                >
                  Collections
                  <svg className={`w-3 h-3 transition-transform duration-300 ${isCollectionsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#C5A059] transition-all duration-300 ${isCollectionsOpen ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>

                {/* Dropdown Menu */}
                {isCollectionsOpen && collections.length > 0 && (
                  <>
                    {/* Invisible bridge to prevent closing when moving mouse to menu */}
                    <div className="absolute top-full left-0 w-full h-4 bg-transparent z-[45]" />

                    <div
                      className={`absolute top-full left-0 mt-2 bg-white border border-brand/5 rounded-2xl shadow-2xl py-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50 ${collections.length > 10 ? "w-[540px] grid grid-cols-2 gap-x-2" : "w-64 flex flex-col"
                        }`}
                      onMouseEnter={() => setIsCollectionsOpen(true)}
                    >
                      {collections.map((item, i) => (
                        <Link
                          key={i}
                          href={`/category/${item.slug}`}
                          className="block px-6 py-3 text-[13px] font-bold tracking-wide text-brand hover:text-[#C5A059] hover:bg-brand/5 transition-all truncate"
                          onClick={() => setIsCollectionsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </nav>

            <div className="hidden md:flex items-center space-x-4 ml-auto text-white">
              {/* Search Icon Triggering Modal */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                className="hover:text-[#C5A059] transition-colors p-2 flex items-center cursor-pointer"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link href="/about" aria-label="Our Store" className="hover:text-[#C5A059] transition-colors p-2 flex items-center gap-1 group whitespace-nowrap">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-black tracking-wider hidden lg:block">Our Store</span>
              </Link>

              <Link href="/b2b" aria-label="B2B" className="hover:text-[#C5A059] transition-colors p-2 flex items-center gap-1 group whitespace-nowrap">
                <Briefcase className="h-5 w-5" />
                <span className="text-[10px] font-black tracking-wider hidden lg:block">B2B</span>
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="hover:text-[#C5A059] transition-colors relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#C5A059] text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-brand">
                  {cartCount}
                </span>
              </Link>

              {user ? (
                <ProfileDropdown
                  user={user}
                  onLogout={() => setIsLogoutModalOpen(true)}
                />
              ) : (
                <button
                  onClick={() => window.location.href = "/login"}
                  className="flex items-center space-x-2 text-xs font-bold tracking-[0.15em] bg-[#C5A059] text-white px-6 py-2.5 rounded-full hover:bg-[#B38E46] transition-all shadow-md cursor-pointer relative z-10"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-4">
              <button onClick={() => setIsSearchOpen(true)} aria-label="Search" className="text-white p-2">
                <Search className="h-5 w-5" />
              </button>
              <Link href="/about" aria-label="Our Store" className="text-white p-2">
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link href="/b2b" aria-label="B2B" className="text-white p-2">
                <Briefcase className="h-5 w-5" />
              </Link>
              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="text-white relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#C5A059] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-brand">
                  {cartCount}
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-[#C5A059] focus:outline-none p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand border-t border-white/10 animate-in slide-in-from-top duration-300">
            <div className="px-6 pt-8 pb-12 space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="block h-12 bg-white/5 rounded-xl animate-pulse"></div>
                ))
              ) : (
                navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`block px-6 py-4 rounded-2xl text-sm font-bold tracking-wider transition-all ${isActive
                        ? "bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/20 translate-x-2"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })
              )}

              {/* Mobile Collections */}
              <div className="space-y-2">
                <p className="px-6 text-[10px] font-black tracking-[0.15em] text-white/20 mb-2">Our Collections</p>
                {collections.map((item, i) => (
                  <Link
                    key={i}
                    href={`/category/${item.slug}`}
                    className="block px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10">
                {user ? (
                  <div className="space-y-4">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-4 px-4 py-4 rounded-xl bg-white/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-white font-bold">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-bold tracking-wider text-white">{user.fullName || "My Profile"}</div>
                        <div className="text-[10px] text-white/40 tracking-wider">View Details</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-3 px-4 py-4 rounded-xl border-2 border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-xs"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = "/login";
                    }}
                    className="block w-full px-4 py-5 rounded-xl text-center text-sm font-bold tracking-[0.15em] text-white bg-[#C5A059] hover:bg-[#B38E46] shadow-lg relative z-10"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500 h-6 w-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-brand mb-2">Log out</h3>
              <p className="text-brand/60 text-sm mb-8 leading-relaxed">
                Are you sure you want to log out from NutspiceCo? You'll need to verify your phone number to sign in again.
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-red-50 text-red-500 font-bold text-sm tracking-widest uppercase hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-brand text-white font-bold text-sm tracking-widest uppercase hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}



