export function PageHeading({ title, description }: { title: string; description: string; action?: string }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div></div>;
}
