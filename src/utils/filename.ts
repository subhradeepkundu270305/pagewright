export function generateFilename(title: string, extension: string = '.pdf'): string {
  let baseTitle = title;
  if (!baseTitle || baseTitle.trim() === '') {
    baseTitle = 'untitled-page';
  }

  // Sanitize: remove special chars except hyphens/underscores/spaces, trim, replace spaces with hyphens, lowercase
  let sanitized = baseTitle
    .replace(/[^\w\s-]/g, '') // \w includes a-zA-Z0-9_
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  // Truncate to 100 chars max
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100).replace(/-+$/, '');
  }

  // Add date suffix in YYYY-MM-DD format
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateSuffix = `${year}-${month}-${day}`;

  const ext = extension.startsWith('.') ? extension : `.${extension}`;

  return `${sanitized}-${dateSuffix}${ext}`;
}
