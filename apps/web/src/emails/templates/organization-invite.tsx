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

export type OrganizationInviteProps = {
  organization: string;
  inviter: string;
  acceptUrl: string;
  declineUrl: string;
  recipient: string;
  expires: Date;
};

export function OrganizationInvite({
  organization = 'Contoso Ltd',
  inviter = 'Alice Smith',
  acceptUrl = 'https://www.paklo.app/organization/invite/accept?id=123',
  declineUrl = 'https://www.paklo.app/organization/invite/decline?id=123',
  recipient = 'chris.johnson@contoso.com',
  expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
}: OrganizationInviteProps) {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans'>
          <Preview>You've been invited to join {organization}</Preview>
          <Container className='mx-auto my-10 max-w-[465px] p-5'>
            <Section>
              <Row>
                <Text className='text-[24px] font-bold text-black mb-4'>You're invited to join {organization}</Text>
              </Row>
              <Row>
                <Text>
                  <strong>{inviter}</strong> has invited you to join <strong>{organization}</strong>. Click the button
                  below to accept the invitation and start collaborating.
                </Text>
              </Row>
              <Row>
                <Text className='text-[14px] text-[#666666] mt-2'>
                  This invitation expires on{' '}
                  {expires.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  .
                </Text>
              </Row>
              <Row>
                <Button
                  className='rounded bg-[#0070f3] px-5 py-3 text-center font-semibold text-[14px] text-white no-underline mr-2'
                  href={acceptUrl}
                >
                  Accept Invitation
                </Button>
                <Button
                  className='rounded bg-[#666666] px-5 py-3 text-center font-semibold text-[14px] text-white no-underline'
                  href={declineUrl}
                >
                  Decline
                </Button>
              </Row>
              <Row>
                <Text className='text-[#666666] mt-4'>
                  If the buttons don't work, you can copy and paste these links:
                </Text>
                <Text>
                  Accept:
                  <br />
                  {acceptUrl}
                  <br />
                  <br />
                  Decline:
                  <br />
                  {declineUrl}
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

export default OrganizationInvite;
