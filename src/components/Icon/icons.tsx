import { Icon } from './Icon';

export const CloseIcon = () => <Icon d="M0 0h2v1h1v1h2v-1h1v-1h2v2h-1v1h-1v2h1v1h1v2h-2v-1h-1v-1h-2v1h-1v1h-2v-2h1v-1h1v-2h-1v-1h-1z" />;

export const GearIcon = () => <Icon d="M3 0h2v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-2h1v-1h1v-1h1zM3 3v2h2v-2z" />;

export const HelpIcon = () => <Icon d="M2 0h4v1h1v3h-1v1h-2v1h-2v-2h1v-1h2v-1h-2v1h-2v-2h1zM2 7h2v1h-2z" />;

export const SoundOnIcon = () => <Icon d="M0 2h2v-1h1v-1h1v8h-1v-1h-1v-1h-2zM5 2h1v4h-1zM7 1h1v6h-1z" />;

export const SoundOffIcon = () => <Icon d="M0 2h2v-1h1v-1h1v8h-1v-1h-1v-1h-2zM5 2h1v1h1v-1h1v1h-1v2h1v1h-1v-1h-1v1h-1v-1h1v-2h-1z" />;

export const PauseIcon = () => <Icon d="M1 0h2v8h-2zM5 0h2v8h-2z" />;

/** The keeper's three choices, by goal column: dive left, stay big (gloves up), dive right. */
const DIVE_PATHS: readonly string[] = [
  'M0 3h1v2h-1zM1 2h1v4h-1zM2 1h1v6h-1zM3 0h1v8h-1zM4 3h4v2h-4z',
  'M0 0h2v2h-2zM6 0h2v2h-2zM3 1h2v2h-2zM1 2h1v1h-1zM6 2h1v1h-1zM1 3h6v1h-6zM2 4h4v2h-4zM2 6h1v1h-1zM5 6h1v1h-1zM1 7h2v1h-2zM5 7h2v1h-2z',
  'M7 3h1v2h-1zM6 2h1v4h-1zM5 1h1v6h-1zM4 0h1v8h-1zM0 3h4v2h-4z',
];

export const DiveIcon = ({ col }: { col: number }) => <Icon d={DIVE_PATHS[col]} />;

export const BackIcon = () => <Icon d="M3 1h2v1h-1v1h4v2h-4v1h1v1h-2v-1h-1v-1h-1v-2h1v-1h1z" />;

/** Two people, one a step behind the other: two players on one device. */
export const PlayersIcon = () => <Icon d="M1 1h2v2h-2zM5 0h2v2h-2zM0 4h4v4h-4zM5 3h3v4h-3z" />;

export const BallIcon = () => <Icon d="M2 0h4v1h1v1h1v4h-1v1h-1v1h-4v-1h-1v-1h-1v-4h1v-1h1zM3 2v2h2v-2z" />;
