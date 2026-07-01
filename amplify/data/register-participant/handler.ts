import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '$amplify/env/register-participant';
import type { Schema } from '../resource';
import {
  buildRegistrationEmailHtml,
  buildRegistrationEmailSubject,
  buildRegistrationEmailText,
} from './email-template';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESClient({});

export const handler: Schema['registerParticipant']['functionHandler'] = async (event) => {
  const {
    firstName,
    paternalLastName,
    maternalLastName,
    ghin,
    handicapIndex,
    phone,
    email,
  } = event.arguments;

  const now = new Date().toISOString();
  const participant = {
    id: randomUUID(),
    __typename: 'Participant' as const,
    firstName,
    paternalLastName,
    maternalLastName,
    ghin,
    handicapIndex,
    phone,
    email,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new PutCommand({
      TableName: env.PARTICIPANT_TABLE_NAME,
      Item: participant,
    }),
  );

  const logoUrl = env.LOGO_URL?.trim() || undefined;
  const fromAddress = env.FROM_NAME ? `${env.FROM_NAME} <${env.FROM_EMAIL}>` : env.FROM_EMAIL;
  const emailData = {
    firstName,
    paternalLastName,
    maternalLastName,
    ghin,
    handicapIndex,
    phone,
    email,
  };

  let confirmationEmailSent = false;
  try {
    await ses.send(
      new SendEmailCommand({
        Source: fromAddress,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: buildRegistrationEmailSubject(emailData),
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: buildRegistrationEmailText(emailData),
              Charset: 'UTF-8',
            },
            Html: {
              Data: buildRegistrationEmailHtml({ ...emailData, logoUrl }),
              Charset: 'UTF-8',
            },
          },
        },
      }),
    );
    confirmationEmailSent = true;
  } catch (err) {
    console.error('Registration saved but confirmation email failed:', err);
  }

  return {
    id: participant.id,
    firstName: participant.firstName,
    email: participant.email,
    confirmationEmailSent,
  };
};
