import { Container } from '@/components/common/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col justify-center items-center gap-3 py-5">
          <div className="flex order-2 gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <a
              href="https://github.com/DMuhammad"
              target="_blank"
              className="text-secondary-foreground hover:text-primary"
            >
              _xzkrmx_
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
