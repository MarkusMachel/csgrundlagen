import type { Locale } from '@/shared/types';

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

/**
 * The privacy policy, per language. {contact} is replaced with
 * VITE_PRIVACY_CONTACT (who runs this instance and how to reach them).
 * When it changes, bump PRIVACY_POLICY_VERSION (and the Go constant).
 */
export const policyContent: Record<Locale, PolicySection[]> = {
  en: [
    {
      heading: 'Who is responsible',
      paragraphs: [
        'The controller for personal data processed by this trainer is {contact}. Write there for any privacy question or to exercise your rights.',
      ],
    },
    {
      heading: 'What we store and why',
      items: [
        'Account data: your name, email address, a hash of your password (never the password itself), language and role. Needed to provide your account (GDPR Art. 6(1)(b)).',
        'Learning data: your answers, review schedule, bookmarks, notes, comments, bug reports, custom tests and attempts. Needed to provide the service (Art. 6(1)(b)).',
        'Security records: for each signed-in device, the IP address and browser (User-Agent) it signed in from, when, and when it was last used; plus a sign-in history including wrong-password attempts on your account. We keep these to protect accounts and so you can see and sign out your devices (legitimate interest, Art. 6(1)(f)). Sessions end when you sign out or after 30 days; the history is deleted after 90 days.',
        'Device details, only if you allow them: time zone, languages, screen and window size, platform, touch support and colour scheme your browser reports. They help you recognise your devices (consent, Art. 6(1)(a)). Withdrawing consent deletes them.',
      ],
    },
    {
      heading: 'Storage in your browser',
      paragraphs: [
        'We use your browser’s local storage, not cookies, and no analytics, advertising or tracking of any kind.',
      ],
      items: [
        'Essential (always on): your sign-in cookie (cft_session, HttpOnly) and your privacy choice (cft.consent).',
        'Preferences (only with consent): your theme and language (cft.ui).',
      ],
    },
    {
      heading: 'Other services',
      paragraphs: [
        'The app loads nothing from third parties. One exception, triggered only by you: pressing Run on a Go snippet sends that snippet’s code to the official Go Playground, operated by Google. Our server makes that request, so Google doesn’t see your IP address. JavaScript snippets run in your browser.',
        'The server and database may be run by a hosting provider on our behalf, under a data processing agreement.',
      ],
    },
    {
      heading: 'Who can see your data',
      paragraphs: [
        'You. The administrators of this platform can see accounts, devices, sign-in history and privacy choices, to support users and keep accounts safe. Comments you post are shown to other users with your name.',
      ],
    },
    {
      heading: 'Your rights',
      items: [
        'Access and portability (Art. 15, 20): download everything we store about you as a JSON file on your Account page.',
        'Erasure (Art. 17): delete your account on your Account page; it removes your data immediately.',
        'Withdraw consent (Art. 7(3)): change your choice any time under “Privacy settings” at the bottom of every page.',
        'Rectification, restriction and objection (Art. 16, 18, 21): contact us at {contact}.',
        'You may also complain to a data protection supervisory authority.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'This policy is dated by its version. When it changes, we show you the new version after you sign in.',
      ],
    },
  ],
  de: [
    {
      heading: 'Verantwortlicher',
      paragraphs: [
        'Verantwortlich für die Verarbeitung personenbezogener Daten in diesem Trainer ist {contact}. Wende dich dorthin bei Fragen zum Datenschutz oder um deine Rechte auszuüben.',
      ],
    },
    {
      heading: 'Was wir speichern und warum',
      items: [
        'Kontodaten: Name, E-Mail-Adresse, ein Hash deines Passworts (nie das Passwort selbst), Sprache und Rolle. Erforderlich, um dein Konto bereitzustellen (DSGVO Art. 6 Abs. 1 lit. b).',
        'Lerndaten: deine Antworten, Wiederholungsplan, Lesezeichen, Notizen, Kommentare, Fehlermeldungen, eigene Tests und Versuche. Erforderlich für den Dienst (Art. 6 Abs. 1 lit. b).',
        'Sicherheitsdaten: für jedes angemeldete Gerät die IP-Adresse und der Browser (User-Agent) bei der Anmeldung, der Zeitpunkt und die letzte Nutzung; dazu ein Anmeldeverlauf einschließlich Versuchen mit falschem Passwort. Wir speichern sie zum Schutz der Konten und damit du deine Geräte sehen und abmelden kannst (berechtigtes Interesse, Art. 6 Abs. 1 lit. f). Sitzungen enden mit der Abmeldung oder nach 30 Tagen; der Verlauf wird nach 90 Tagen gelöscht.',
        'Gerätedetails, nur mit deiner Einwilligung: Zeitzone, Sprachen, Bildschirm- und Fenstergröße, Plattform, Touch-Unterstützung und Farbschema, die dein Browser meldet. Sie helfen dir, deine Geräte zu erkennen (Einwilligung, Art. 6 Abs. 1 lit. a). Ein Widerruf löscht sie.',
      ],
    },
    {
      heading: 'Speicherung in deinem Browser',
      paragraphs: [
        'Wir nutzen den lokalen Speicher deines Browsers, keine Cookies, und keinerlei Analyse, Werbung oder Tracking.',
      ],
      items: [
        'Notwendig (immer aktiv): dein Anmelde-Cookie (cft_session, HttpOnly) und deine Datenschutz-Auswahl (cft.consent).',
        'Einstellungen (nur mit Einwilligung): dein Farbschema und deine Sprache (cft.ui).',
      ],
    },
    {
      heading: 'Andere Dienste',
      paragraphs: [
        'Die App lädt nichts von Dritten. Eine Ausnahme, nur durch dich ausgelöst: „Ausführen“ bei einem Go-Snippet sendet dessen Code an den offiziellen Go Playground von Google. Die Anfrage stellt unser Server, Google sieht also nicht deine IP-Adresse. JavaScript-Snippets laufen in deinem Browser.',
        'Server und Datenbank können in unserem Auftrag von einem Hosting-Anbieter betrieben werden, auf Grundlage eines Auftragsverarbeitungsvertrags.',
      ],
    },
    {
      heading: 'Wer deine Daten sieht',
      paragraphs: [
        'Du. Die Administratoren dieser Plattform sehen Konten, Geräte, Anmeldeverlauf und Datenschutz-Auswahl, um Nutzer zu unterstützen und Konten zu schützen. Kommentare werden anderen Nutzern mit deinem Namen angezeigt.',
      ],
    },
    {
      heading: 'Deine Rechte',
      items: [
        'Auskunft und Datenübertragbarkeit (Art. 15, 20): Lade alle über dich gespeicherten Daten als JSON-Datei auf deiner Kontoseite herunter.',
        'Löschung (Art. 17): Lösche dein Konto auf deiner Kontoseite; deine Daten werden sofort entfernt.',
        'Widerruf (Art. 7 Abs. 3): Ändere deine Auswahl jederzeit unter „Datenschutz-Einstellungen“ unten auf jeder Seite.',
        'Berichtigung, Einschränkung und Widerspruch (Art. 16, 18, 21): Schreib an {contact}.',
        'Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren.',
      ],
    },
    {
      heading: 'Änderungen',
      paragraphs: [
        'Diese Erklärung ist durch ihre Version datiert. Wenn sie sich ändert, zeigen wir dir die neue Fassung nach der Anmeldung.',
      ],
    },
  ],
  'pt-BR': [
    {
      heading: 'Quem é o responsável',
      paragraphs: [
        'O controlador dos dados pessoais tratados neste treinador é {contact}. Escreva para lá com qualquer dúvida sobre privacidade ou para exercer seus direitos.',
      ],
    },
    {
      heading: 'O que armazenamos e por quê',
      items: [
        'Dados da conta: nome, e-mail, um hash da sua senha (nunca a senha em si), idioma e papel. Necessários para fornecer sua conta (RGPD art. 6(1)(b); LGPD art. 7, V).',
        'Dados de estudo: suas respostas, agenda de revisão, favoritos, notas, comentários, relatos de erro, testes e tentativas. Necessários para o serviço (art. 6(1)(b)).',
        'Registros de segurança: para cada dispositivo conectado, o endereço IP e o navegador (User-Agent) usados no login, quando, e o último uso; além de um histórico de login, incluindo tentativas com senha incorreta. Mantemos esses dados para proteger as contas e para que você veja e desconecte seus dispositivos (interesse legítimo, art. 6(1)(f)). Sessões terminam ao sair ou após 30 dias; o histórico é apagado após 90 dias.',
        'Detalhes do dispositivo, só com sua permissão: fuso horário, idiomas, tamanho de tela e janela, plataforma, suporte a toque e esquema de cores informados pelo navegador. Ajudam você a reconhecer seus dispositivos (consentimento, art. 6(1)(a)). Retirar o consentimento os apaga.',
      ],
    },
    {
      heading: 'Armazenamento no seu navegador',
      paragraphs: [
        'Usamos o armazenamento local do navegador, não cookies, e nenhum tipo de análise, publicidade ou rastreamento.',
      ],
      items: [
        'Essencial (sempre ativo): seu cookie de login (cft_session, HttpOnly) e sua escolha de privacidade (cft.consent).',
        'Preferências (só com consentimento): seu tema e idioma (cft.ui).',
      ],
    },
    {
      heading: 'Outros serviços',
      paragraphs: [
        'O app não carrega nada de terceiros. Uma exceção, acionada só por você: “Executar” em um trecho de Go envia o código ao Go Playground oficial, operado pelo Google. Quem faz a requisição é o nosso servidor, então o Google não vê o seu IP. Trechos de JavaScript rodam no seu navegador.',
        'O servidor e o banco de dados podem ser operados por um provedor de hospedagem em nosso nome, sob contrato de tratamento de dados.',
      ],
    },
    {
      heading: 'Quem vê seus dados',
      paragraphs: [
        'Você. Os administradores desta plataforma veem contas, dispositivos, histórico de login e escolhas de privacidade, para dar suporte e manter as contas seguras. Comentários aparecem para outros usuários com o seu nome.',
      ],
    },
    {
      heading: 'Seus direitos',
      items: [
        'Acesso e portabilidade (art. 15, 20): baixe tudo o que armazenamos sobre você em um arquivo JSON na página da sua conta.',
        'Exclusão (art. 17): exclua sua conta na página da conta; seus dados são removidos na hora.',
        'Retirar o consentimento (art. 7(3)): mude sua escolha a qualquer momento em “Configurações de privacidade”, no rodapé de cada página.',
        'Retificação, limitação e oposição (art. 16, 18, 21): escreva para {contact}.',
        'Você também pode reclamar a uma autoridade de proteção de dados (no Brasil, a ANPD).',
      ],
    },
    {
      heading: 'Alterações',
      paragraphs: [
        'Esta política é datada pela sua versão. Quando ela mudar, mostraremos a nova versão depois que você entrar.',
      ],
    },
  ],
};
