import { GlassButton, GlassCard, Skeleton, Spinner } from "@qaf/ui";
import styles from "./componentsPage.module.css";

export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className={styles.root}>
        <h1>Not available in production.</h1>
      </main>
    );
  }

  return (
    <main className={styles.root}>
      <h1>Component catalog</h1>

      <section className={styles.section}>
        <h2>GlassCard</h2>
        <div className={styles.row}>
          <GlassCard>
            <p>Default glass card.</p>
          </GlassCard>
          <GlassCard elevated>
            <p>Elevated glass card.</p>
          </GlassCard>
        </div>
      </section>

      <section className={styles.section}>
        <h2>GlassButton</h2>
        <div className={styles.row}>
          <GlassButton>Primary</GlassButton>
          <GlassButton variant="secondary">Secondary</GlassButton>
          <GlassButton variant="ghost">Ghost</GlassButton>
          <GlassButton isLoading>Loading</GlassButton>
          <GlassButton disabled>Disabled</GlassButton>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Spinner</h2>
        <div className={styles.row}>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Skeleton</h2>
        <div className={styles.col}>
          <Skeleton width="30rem" height="2rem" />
          <Skeleton width="20rem" height="1.4rem" />
          <Skeleton width="40rem" height="1.4rem" />
        </div>
      </section>
    </main>
  );
}
