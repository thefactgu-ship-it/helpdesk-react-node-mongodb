import { cx } from "./classNames";

const variants = {
  hero: "ops-dashboard-hero",
  plain: "ops-panel",
  soft: "ops-soft-panel",
};

function Panel({ children, className = "", variant = "soft", ...props }) {
  return (
    <section className={cx(variants[variant] || variants.soft, className)} {...props}>
      {children}
    </section>
  );
}

export default Panel;
