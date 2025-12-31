export default function Loading() {
  // need this for <TooltipProvider> and <ThemeProvider> to work with cacheComponents
  // it also works when a loading.tsx is not present at any level
  // ideally, we should have skeletons in all the other layers
  return null;
}
