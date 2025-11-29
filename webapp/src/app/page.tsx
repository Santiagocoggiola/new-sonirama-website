import { redirect } from 'next/navigation';

/**
 * Home page - redirects to products catalog
 */
export default function HomePage() {
  redirect('/products');
}
