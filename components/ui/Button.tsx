import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "glass";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps & Omit<ComponentProps<"button">, keyof CommonProps> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps> & { href: ComponentProps<typeof Link>["href"] };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function buttonClassName({ variant = "primary", size = "md", block, className }: CommonProps) {
  return [styles.button, styles[variant], styles[size], block && styles.block, className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const { variant, size, icon, iconRight, block, className, children, ...rest } = props;
  const cls = buttonClassName({ variant, size, block, className });
  const content = (
    <>
      {icon}
      {children && <span>{children}</span>}
      {iconRight}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as Omit<ButtonAsLink, keyof CommonProps>)}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as Omit<ButtonAsButton, keyof CommonProps>;
  return (
    <button type="button" className={cls} {...buttonProps}>
      {content}
    </button>
  );
}
