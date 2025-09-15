import { Body, Container, Head, Html, Link, Preview, Row, Section, Tailwind, Text } from '@react-email/components';

export type MagicLinkProps = {
  url: string;
  token: string;
};

export function MagicLink({ url = 'https://dashboard.paklo.app/sign-in/123', token = '123' }: MagicLinkProps) {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>Your sign-in link for Paklo</Preview>
          <Container className='mx-auto my-[40px] max-w-[465px] p-[20px]'>
            <Section>
              <Row>
                <Text>Click the link below to sign in to your account:</Text>
              </Row>
              <Row>
                <Link href={url} className='text-blue-600 no-underline'>
                  {url}
                </Link>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default MagicLink;
