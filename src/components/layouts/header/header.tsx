import { cn } from "@/lib/utils";
import Link from "next/link";
import NavLinks from "./nav-links";
import ThemeButton from "@/components/theme-button";
import DropButton from "./drop-button";
import UserButton from "../../auth/user-button";
import IconCkziu1Logo from "@/components/icons/ckziu1-logo";

export default function Header() {
  return (
    <>
      <header
        className={cn(
          "w-full bg-background/80 backdrop-blur border-b shadow-sm rounded-t-xl"
        )}
      >
        <div className="flex items-center h-16 gap-4 px-4 mx-auto text-sm max-w-[1900]">
          <DropButton className="md:hidden" />
          <Link
            href={"/"}
            className="flex gap-2 justify-center align-middle text-2xl font-bold"
          >
            <IconCkziu1Logo className={"w-10 h-10 self-center"} />
            <span className="flex items-center ">2LL1</span>
          </Link>
          <NavLinks className="hidden gap-4 md:flex" />
          <div className="flex items-center gap-4 ml-auto">
            <ThemeButton className="hidden md:flex" />
            <UserButton />
          </div>
        </div>
      </header>
    </>
  );
}
