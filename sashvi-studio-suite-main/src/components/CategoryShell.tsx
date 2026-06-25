import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface CategoryFilter {
  name: string;
  image?: string;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  filters: (string | CategoryFilter)[];
  activeTag?: string;
  basePath: string;
  children: ReactNode;
  showCategoryGrid?: boolean;
}

export function CategoryShell({ eyebrow, title, description, filters, activeTag, basePath, children, showCategoryGrid = false }: Props) {
  return (
    <>
      <section className='border-b border-border bg-secondary/40'>
        <div className='container-luxe py-14 md:py-20'>
          <div className='eyebrow mb-4'>{eyebrow}</div>
          <div className='grid items-end gap-6 md:grid-cols-[1fr_auto]'>
            <h1 className='font-display text-4xl md:text-6xl text-foreground'>{title}</h1>
            <p className='max-w-md text-muted-foreground'>{description}</p>
          </div>
        </div>
      </section>

      {showCategoryGrid ? (
        <section className='container-luxe py-10'>
          <div className='grid gap-4 mb-8 md:grid-cols-3 lg:grid-cols-4'>
            {filters.map((f) => {
              const filterName = typeof f === 'string' ? f : f.name;
              const filterImage = typeof f === 'string' ? undefined : f.image;
              return (
                <Link
                  key={filterName}
                  to={basePath}
                  search={{ tag: filterName }}
                  className='block'
                >
                  <div className='relative overflow-hidden rounded-2xl aspect-[4/5]'>
                    {filterImage ? (
                      <img src={filterImage} alt={filterName} className='h-full w-full object-cover' />
                    ) : (
                      <div className='h-full w-full bg-secondary flex items-center justify-center'>
                        <span className='text-center font-semibold text-foreground px-4'>{filterName}</span>
                      </div>
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent hover:from-foreground/90 transition'>
                      <div className='absolute bottom-0 left-0 right-0 p-4'>
                        <h3 className='font-semibold text-sm text-background mb-2 leading-tight'>{filterName}</h3>
                        <button className='w-full px-3 py-2 bg-background text-foreground text-xs font-semibold rounded-md hover:bg-accent hover:text-background transition'>
                          EXPLORE
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className='container-luxe py-10'>
          <div className='mb-8 flex flex-wrap gap-2'>
            <Link
              to={basePath}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                !activeTag
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-foreground/70 hover:border-accent hover:text-accent'
              }`}
            >
              All
            </Link>
            {filters.map((f) => {
              const filterName = typeof f === 'string' ? f : f.name;
              return (
                <Link
                  key={filterName}
                  to={basePath}
                  search={{ tag: filterName }}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                    activeTag === filterName
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card text-foreground/70 hover:border-accent hover:text-accent'
                  }`}
                >
                  {filterName}
                </Link>
              );
            })}
          </div>
          {children}
        </section>
      )}
    </>
  );
}
