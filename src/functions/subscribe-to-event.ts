import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { subscriptions } from '../drizzle/schema/subscriptions'
import { redis } from '../redis/client'

interface SubscribeToEventParams {
  name: string
  email: string
  referrerId?: string | null
}

export async function subscribeToEvent({
  name,
  email,
  referrerId,
}: SubscribeToEventParams) {
  const subscribers = await db //buscando no banco de dados se já não há um usuário
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.email, email)) //onde o e-mail é igual ao email que estamos recebendo / eq = equal | onde | o que

  if (subscribers.length > 0) {
    return { subscriberId: subscribers[0].id }
  }

  const result = await db
    .insert(subscriptions)
    .values({
      name,
      email,
    })
    .returning()

  if (referrerId) {
    await redis.zincrby('referral:ranking', 1, referrerId) //nome para o SortedSet | quanto incrementar | id do usuário que vai pontuar (quem convidou)
  }

  const subscriber = result[0]

  return {
    subscriberId: subscriber.id,
  }
}
