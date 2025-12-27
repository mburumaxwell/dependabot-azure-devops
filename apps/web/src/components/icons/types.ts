export type IconProps = React.ComponentPropsWithoutRef<'svg'>;
export type Icon = React.ComponentType<IconProps>;

export type IconPropsWithOpenGraph = IconProps & {
  /** Whether the icon is for use in OG images. */
  og?: boolean;

  /**
   * Whether the icon is for use in dark mode.
   * Only used when `og` is `true`.
   */
  dark?: boolean;
};
