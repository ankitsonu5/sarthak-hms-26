# Hospital Config - Multi-Tenant Theme

Deploy ke time har hospital ke liye alag `hospital-config.json` use karein.

## Example: Apollo Hospital
```json
{
  "hospitalId": "apollo-001",
  "hospitalName": "Apollo Hospital",
  "themeId": "apollo",
  "logoUrl": "/assets/logos/apollo.png"
}
```

## Example: Fortis Hospital
```json
{
  "hospitalId": "fortis-001",
  "hospitalName": "Fortis Hospital",
  "themeId": "fortis"
}
```

## Available Themes
- `default` - Blue
- `apollo` - Teal
- `fortis` - Purple
- `max` - Red
- `green` - Green

## Deployment
Build ke baad `dist/browser/config/hospital-config.json` replace karein per hospital.
