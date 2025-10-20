import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Container } from '@/components/common/container';

export function Header() {
  const scrollPosition = useScrollPosition();
  const headerSticky = scrollPosition > 0;

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex items-center gap-2.5">
          <Link to="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/INACO.png')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>
        </div>

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          <UserDropdownMenu
            trigger={
              <img
                className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
                src={toAbsoluteUrl('/media/avatars/300-2.png')}
                alt="User Avatar"
              />
            }
          />
        </div>
      </Container>
    </header>
  );
}
