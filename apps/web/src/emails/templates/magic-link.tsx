import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export type MagicLinkProps = {
  email: string;
  url: string;
  token: string;
};

export function MagicLink({
  email = 'chris.johnson@contoso.com',
  url = 'https://www.paklo.app/login/123',
  token = '123',
}: MagicLinkProps) {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>Your login link for Paklo Dashboard is inside</Preview>
          <Container className='mx-auto my-[40px] max-w-[465px] p-[20px]'>
            <Section>
              <Row>
                <Text>
                  Click the link below to login to your account or create an account. This link will expire in 5
                  minutes.
                </Text>
              </Row>
              <Row>
                <Button
                  className='rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline'
                  href={url}
                >
                  Continue
                </Button>
              </Row>
              <Row>
                <Text>If you cannot click the button, copy and paste the URL below into your web browser:</Text>
                <Link href={url} className='text-blue-600 no-underline'>
                  {url}
                </Link>
              </Row>
            </Section>
            <Hr className='mx-0 my-[26px] w-full border border-[#eaeaea] border-solid' />
            <Text className='text-[#666666] text-[12px] leading-[24px]'>
              This email was intended for <span className='text-black'>{email}</span>. If you were not expecting this
              email, you can ignore it. If you are concerned about your account's safety, please reply to this email to
              get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default MagicLink;
