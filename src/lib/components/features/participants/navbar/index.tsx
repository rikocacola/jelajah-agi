"use client";

import {
  HomeIcon,
  ClockIcon,
  ScanBarcodeIcon,
  ListChecks,
  UserCircle,
} from "lucide-react";
import { useCookies } from "next-client-cookies";

import { useRouter, usePathname } from "next/navigation";

const NavbarParticipant = () => {
  const cookies = useCookies();
  const uid = cookies.get("uid");
  const dataMenu = [
    {
      id: 0,
      href: "/",
      icon: <HomeIcon size={24} />,
      needAuth: false,
    },
    {
      id: 0,
      href: "/clock",
      icon: <ClockIcon size={24} />,
      needAuth: false,
    },
    {
      id: 0,
      href: "/participants/scan-qr",
      icon: <ScanBarcodeIcon size={24} />,
      needAuth: true,
    },
    {
      id: 0,
      href: "/participants",
      icon: <ListChecks size={24} />,
      needAuth: true,
    },
    {
      id: 0,
      href: "/profile",
      icon: <UserCircle size={24} />,
      needAuth: false,
    },
  ];

  const router = useRouter();
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 h-[50px] border-t border-t-primary shadow-sm w-screen z-10">
      <ul className="flex justify-between size-full">
        {dataMenu.map((menu,index) => {
          return (
            <li
              key={index}
              onClick={() => {
                if (!menu.needAuth || uid) {
                  router.push(menu.href);
                } else {
                  router.replace("/login");
                }
              }}
              className={`flex items-center justify-center size-full border-x border-x-primary ${
                pathname === menu.href
                  ? "bg-primary text-white"
                  : " bg-white text-primary"
              }`}
            >
              {menu.icon}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavbarParticipant;
