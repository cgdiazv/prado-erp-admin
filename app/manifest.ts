import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prado ERP — Sistema de Gestión Empresarial',
    short_name: 'Prado ERP',
    description:
      'Sistema integral de gestión empresarial, contabilidad, control bancario, inventarios, compras y ventas de Prado ERP.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#1b426e',
    orientation: 'any',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
