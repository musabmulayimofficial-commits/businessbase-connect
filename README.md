# BusinessBase Connect

Build BusinessBase as a complete production-ready Turkish entrepreneur networking platform.

IMPORTANT:

Do NOT create a prototype or static mockup.

Implement the complete application with real functionality, authentication, database, user profiles, networking, messaging, opportunities, events, notifications and settings.

Use Supabase for authentication, database, storage and security.

Do not leave TODOs.

Do not create fake functionality.

Do not use hardcoded users, messages or connection states once the database is connected.

==================================================

1. 🎨 PREMIUM 3D GLASSMORPHISM DESIGN

==================================================

The entire application must use one consistent premium visual system.

Visual concept:

A private digital office floating inside a dark 3D environment.

Background:

- dark matte charcoal gray

- subtle 3D depth

- soft ambient lighting

- very subtle animated abstract shapes

- slow movement

- subtle parallax

- no photographs

- no stock backgrounds

Colors:

#17191C

#1D2024

#23272C

Glass panels:

rgba(255,255,255,0.05)

rgba(255,255,255,0.07)

rgba(255,255,255,0.09)

Borders:

rgba(255,255,255,0.12)

Primary text:

#F5F5F5

Secondary text:

#A8ADB5

Accent:

BusinessBase blue.

Use:

- backdrop blur

- translucent glass

- subtle reflections

- thin borders

- soft shadows

- layered depth

Do NOT use:

- neon

- purple/pink gradients

- gaming aesthetics

- excessive rounded cards

- white backgrounds

- photographs

All interface panels must remain straight.

Do not rotate or skew UI elements.

Use Inter or Manrope.

==================================================

2. PUBLIC WEBSITE

==================================================

Create:

/

 /network

 /firsatlar

 /etkinlikler

 /hakkimizda

 /networke-katil

 /basvuru-alindi

 /topluluk-kurallari

 /gizlilik-politikasi

HEADER:

BUSINESSBASE

Ana Sayfa

Network

Fırsatlar

Etkinlikler

Hakkımızda

Right:

Giriş Yap

Network'e Katıl

Use a floating transparent glass navigation bar.

HOME:

Hero:

“Girişimcilerin birbirini bulduğu network.”

Description:

“Fikirlerini paylaş. Doğru insanlarla tanış. İş ortaklıkları kur. Girişimcilik dünyasında yeni fırsatlar keşfet.”

Buttons:

Network'e Katıl

Network'ü Keşfet

Statistics:

1.200+

Girişimci

380+

Kurulan bağlantı

45+

Aylık fırsat

12

Yıllık etkinlik

Sections:

“Girişimcilik, doğru bağlantılarla büyür.”

Girişimcilerle Tanış

İş Ortaklıkları Kur

Fikirlerini Paylaş

Yeni Fırsatlar Keşfet

“Doğru insanı bul.”

“Network sadece tanışmak değildir.”

“BusinessBase Events”

CTA:

“Doğru bağlantı, doğru zamanda her şeyi değiştirebilir.”

==================================================

3. 🔐 AUTHENTICATION

==================================================

Use Supabase Auth.

Routes:

/kayit-ol

/giris-yap

/sifremi-unuttum

Registration:

Ad Soyad

E-posta

Şifre

Şifre Tekrarı

Password minimum:

8 characters.

Login:

E-posta

Şifre

Forgot password must work through email reset.

After successful login:

redirect to /ana-panel.

Authenticated users should not see login/register pages.

Unauthenticated users attempting to access private routes must be redirected to /giris-yap.

==================================================

4. 🏢 DIGITAL OFFICE

==================================================

Create:

/ana-panel

This must feel like a private digital office, NOT a generic admin dashboard.

Desktop layout:

LEFT:

floating glass navigation

BUSINESSBASE

Ana Panel

Profilim

Network

Mesajlar

Bağlantılarım

Fırsatlar

Etkinlikler

Bottom:

Ayarlar

CENTER:

main workspace

RIGHT:

activity panel

Top:

“Hoş geldin, {authenticated user's name} 👋”

“Bugün networkünde neler oluyor?”

CENTER SECTIONS:

Networküm

Son Mesajlar

Sana Özel

Fırsatlarım

Yaklaşan Etkinlikler

RIGHT:

Bildirimler

Yaklaşan Etkinlikler

Son Aktiviteler

Use real database data.

==================================================

5. 👤 USER PROFILE

==================================================

Routes:

/profilim

/profil/:id

Profile fields:

full_name

avatar

role

sector

city

bio

entrepreneurship_status

skills

interests

Users can edit only their own profile.

Use Supabase Storage for profile images.

Public profile shows:

Avatar

Name

Role

Sector

City

Bio

Skills

Interests

Other members can:

“Bağlantı Gönder”

Profile owner can:

“Profili Düzenle”

==================================================

6. 🌐 NETWORK DISCOVERY

==================================================

Route:

/network

Show real members from Supabase.

Search by:

Name

Sector

City

Role

Filters:

Sector

City

Entrepreneurship status

Profile cards:

Avatar

Name

Role

Sector

City

Short bio

Button:

“Profili Gör”

==================================================

7. 🤝 CONNECTION SYSTEM

==================================================

Implement real connection requests.

Users can:

Send request

Accept request

Reject request

Cancel request

Remove connection

States:

Bağlantı Gönder

İstek Gönderildi

İsteği Kabul Et

Bağlantıdasınız

Prevent self-connections.

Create proper database relationships.

==================================================

8. 💬 MESSAGING

==================================================

Route:

/mesajlar

Real private messaging between connected users.

Features:

Conversation list

Open conversation

Send message

Receive message

Unread message count

Message timestamps

Only conversation participants can access messages.

==================================================

9. 💼 OPPORTUNITIES

==================================================

Route:

/firsatlar

Categories:

Ortak Arıyorum

Yatırım Arıyorum

Yatırımcı Arıyorum

İş Ortağı Arıyorum

Ekip Arkadaşı Arıyorum

Proje

Diğer

Users can:

Browse

Search

Filter

Create

Edit own

Delete own

Opportunity fields:

title

category

description

location

created_by

created_at

==================================================

10. 📅 EVENTS

==================================================

Route:

/etkinlikler

Events contain:

name

date

time

location

description

organizer

participants

Users can:

View

Join

Leave

Show participant count.

==================================================

11. 🔔 NOTIFICATIONS

==================================================

Create a real notification system.

Generate notifications for:

Connection requests

Accepted connections

New messages

Opportunity interactions

Event reminders

Show unread count in the navigation.

Notifications should be linked to the relevant entity when possible.

==================================================

12. ⚙️ SETTINGS

==================================================

Route:

/ayarlar

Sections:

Profil

Hesap

Bildirimler

Güvenlik

Allow:

Edit profile

Change password

Notification preferences

Logout

==================================================

13. 📝 BUSINESSBASE APPLICATION

==================================================

Route:

/networke-katil

Fields:

Ad Soyad

E-posta

Telefon

Şehir

Meslek / Sektör

Girişimcilik Durumu

Neden BusinessBase'e katılmak istiyorsun?

Consent:

“BusinessBase Topluluk Kuralları'nı ve Gizlilik Politikası'nı kabul ediyorum.”

Links:

/topluluk-kurallari

/gizlilik-politikasi

After successful submission:

/basvuru-alindi

Show:

“Başvurun alındı.”

Do not claim that membership has been approved.

==================================================

14. 🗄️ DATABASE

==================================================

Create and properly relate these Supabase tables:

profiles

applications

connection_requests

connections

conversations

messages

opportunities

events

event_participants

notifications

Use proper primary keys, foreign keys, timestamps and indexes where appropriate.

==================================================

15. 🔒 SECURITY

==================================================

Implement Supabase Row Level Security.

Users can only:

- edit their own profile

- manage their own opportunities

- access conversations they participate in

- send/manage their own connection requests

- manage their own notification state

Private information must never be publicly exposed.

Never store passwords manually.

==================================================

16. 📱 RESPONSIVE DESIGN

==================================================

Desktop:

3-column digital office.

Tablet:

collapse right activity panel.

Mobile:

bottom navigation:

Ana Panel

Network

Mesajlar

Fırsatlar

Profil

All public and private pages must work on:

Desktop

Tablet

Mobile

No horizontal overflow.

==================================================

17. 🎞️ ANIMATION

==================================================

Use subtle premium animations:

- glass panels fade in

- subtle hover lift

- slow ambient background movement

- smooth page transitions

- subtle button interactions

Do NOT overanimate.

==================================================

18. 🧩 COMPONENT ARCHITECTURE

==================================================

Create reusable components for:

GlassPanel

GlassButton

Navigation

ProfileCard

OpportunityCard

EventCard

NotificationItem

MessagePreview

MemberCard

Modal

FormField

Use a centralized design system so changing the glass theme later is easy.

==================================================

19. 🧪 TEST EVERYTHING

==================================================

Before finishing, test:

Registration

Login

Logout

Password reset

Protected routes

Profile creation

Profile editing

Profile viewing

Network search

Network filtering

Connection request

Accept/reject connection

Messaging

Opportunity creation/edit/delete

Event joining/leaving

Notifications

Settings

Mobile navigation

Fix errors before considering the project complete.

==================================================

20. 🚀 PRODUCTION READINESS

==================================================

Prepare the application for production deployment.

Use environment variables correctly.

Do not expose secret keys in frontend code.

Create proper loading states.

Create proper empty states.

Create proper error states.

Create success messages.

Use accessible buttons and forms.

Use semantic HTML.

Optimize images and assets.

Ensure responsive performance.

IMPORTANT FINAL RULE:

Do not stop after creating the visual interface.

All listed systems must be implemented as real functionality using Supabase.

If a feature cannot be fully implemented automatically, create the correct database structure, UI, routes, state management and integration points rather than replacing it with fake/demo functionality.

The final result should be a complete BusinessBase entrepreneur networking platform.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/90985c2a-3eed-449a-8bfe-5e7c4d140e16).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
