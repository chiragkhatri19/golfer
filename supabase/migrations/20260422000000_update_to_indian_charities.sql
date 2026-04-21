-- Update existing UK charities to Indian NGOs
UPDATE public.charities SET 
  name = 'Goonj',
  description = 'Channeling urban surplus to rural and urban underserved communities across India, empowering dignity through sharing.',
  featured = true
WHERE name = 'Open Doors Foundation';

UPDATE public.charities SET 
  name = 'Pratham',
  description = 'Providing quality education to underprivileged children across India with innovative learning programs.'
WHERE name = 'Bright Futures Trust';

UPDATE public.charities SET 
  name = 'Akshaya Patra Foundation',
  description = 'Running the world''s largest mid-day meal program for school children across India.'
WHERE name = 'Coastline Conservancy';

UPDATE public.charities SET 
  name = 'GiveIndia (Give Foundation)',
  description = 'Connecting donors with verified nonprofits to ensure transparent and impactful giving across India.'
WHERE name = 'Hearts Together';

UPDATE public.charities SET 
  name = 'Teach For India',
  description = 'Addressing educational inequity by placing Fellows in low-income classrooms across the nation.'
WHERE name = 'Veterans Forward';

UPDATE public.charities SET 
  name = 'HelpAge India',
  description = 'Supporting elderly individuals in need with healthcare, shelter, and dignity across India.'
WHERE name = 'Roots & Roots Kitchen';
