import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import TravelMapPage from '@/components/TravelMapPage';
import { findSubject } from '@/lib/subjects';

type PersonPageProps = {
  params: Promise<{ person: string }>;
};

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { person } = await params;
  const subject = findSubject(decodeURIComponent(person));
  if (!subject) return {};
  return {
    title: subject.meta.title,
    description: subject.meta.description,
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { person } = await params;
  const subject = findSubject(decodeURIComponent(person));
  if (!subject) notFound();

  return <TravelMapPage person={subject.id} />;
}
