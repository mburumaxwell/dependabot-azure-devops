import { Globe } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { REGIONS, type RegionCode } from '@/lib/regions';
import { cn } from '@/lib/utils';

type RegionsSelectProps = {
  selected: RegionCode;
  onValueChange(value: RegionCode): void;
} & Omit<React.ComponentProps<typeof RadioGroup>, 'value' | 'onValueChange'>;

// perhaps will be better as a searchable select dropdown (or combobox) in the future
export function RegionsSelect({ selected, className, onValueChange, ...props }: RegionsSelectProps) {
  // filter regions allowed to be shown, sort by available the label
  const regions = REGIONS.filter((region) => region.visible).sort(
    (a, b) => Number(b.available) - Number(a.available) || a.label.localeCompare(b.label),
  );

  return (
    <RadioGroup
      value={selected}
      onValueChange={(value) => onValueChange(value as RegionCode)}
      className={cn('grid grid-cols-2 gap-4', className)}
      {...props}
    >
      {regions.map((region) => (
        <div key={region.code} className='relative'>
          <label
            htmlFor={region.code}
            className={cn(
              'flex items-center gap-4 rounded-lg border-2 p-4 transition-all cursor-pointer',
              !region.available && 'opacity-50 cursor-not-allowed',
              region.available && selected === region.code
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50',
            )}
          >
            <RadioGroupItem value={region.code} id={region.code} disabled={!region.available} className='shrink-0' />
            <div className='flex items-center gap-4 flex-1'>
              <div className='size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                <Globe className='size-6' />
              </div>
              <div className='flex-1'>
                <div className='font-semibold'>{region.label}</div>
                <div className='text-sm text-muted-foreground'>
                  {region.available ? 'Available now' : 'Coming soon'}
                </div>
              </div>
            </div>
            {!region.available && (
              <div className='absolute inset-0 backdrop-blur-[2px] rounded-lg flex items-center justify-center'>
                <span className='bg-background/90 px-4 py-2 rounded-full text-sm font-medium border'>Coming Soon</span>
              </div>
            )}
          </label>
        </div>
      ))}
    </RadioGroup>
  );
}
