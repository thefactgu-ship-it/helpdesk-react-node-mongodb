import { cx } from "./classNames";

const variants = {
  interactive: "ops-soft-card cursor-pointer",
  plain: "ops-card",
  soft: "ops-soft-card",
};

function Card({ children, className = "", variant = "soft", ...props }) {
  return (
    <article className={cx(variants[variant] || variants.soft, className)} {...props}>
      {children}
    </article>
  );
}

export default Card;
