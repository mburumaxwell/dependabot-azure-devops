import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export type UserDeleteVerificationProps = {
  recipient: string;
  url: string;
};

export function UserDeleteVerification({
  recipient = 'chris.johnson@contoso.com',
  url = 'https://www.paklo.app/delete-account/confirm/123',
}: UserDeleteVerificationProps) {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>Confirm your account deletion request</Preview>
          <Container className='mx-auto my-10 max-w-[465px] p-5'>
            <Section>
              <Row>
                <Text>
                  We received a request to delete your account. If this was you, click the button below to confirm and
                  permanently delete your account. This link will expire in 5 minutes.
                </Text>
              </Row>
              <Row>
                <Text className='text-red-600 font-semibold'>
                  ⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.
                </Text>
              </Row>
              <Row>
                <Button
                  className='rounded bg-[#dc2626] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline'
                  href={url}
                >
                  Confirm Account Deletion
                </Button>
              </Row>
              <Row>
                <Text>
                  If you cannot click the button, copy and paste the URL below into your web browser:
                  <br />
                  {url}
                </Text>
              </Row>
            </Section>
            <Hr className='mx-0 my-[26px] w-full border border-[#eaeaea] border-solid' />
            <Text className='text-[#666666] text-[12px] leading-6'>
              This email was intended for <span className='text-black'>{recipient}</span>. If you were not expecting
              this email, you can ignore it. If you are concerned about your account's safety, please reply to this
              email to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default UserDeleteVerification;
