import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

function generatePluginPhp(apiKey: string, endpoint: string): string {
  return `<?php
/**
 * Plugin Name: Abo SDK
 * Description: Intègre automatiquement le SDK Abo pour le suivi comportemental et l'identification des utilisateurs.
 * Version: 1.0.0
 * Author: Abo
 * License: MIT
 */

if (!defined('ABSPATH')) exit;

// ─── Configuration ───
define('ABO_API_KEY', '${apiKey}');
define('ABO_ENDPOINT', '${endpoint}');
define('ABO_SDK_URL', '${endpoint.replace('/api/sdk/events', '')}/abo-analytics.js');

// ─── Injection du SDK dans le footer ───
add_action('wp_footer', 'abo_sdk_inject_script');
function abo_sdk_inject_script() {
    ?>
    <script src="<?php echo esc_url(ABO_SDK_URL); ?>"></script>
    <script>
        AboAnalytics.init({
            apiKey: '<?php echo esc_js(ABO_API_KEY); ?>',
            endpoint: '<?php echo esc_url(ABO_ENDPOINT); ?>'
        });
        <?php if (is_user_logged_in()) : ?>
        <?php $current_user = wp_get_current_user(); ?>
        AboAnalytics.identify({ email: '<?php echo esc_js($current_user->user_email); ?>' });
        <?php endif; ?>
    </script>
    <?php
}

// ─── Page de réglages ───
add_action('admin_menu', 'abo_sdk_admin_menu');
function abo_sdk_admin_menu() {
    add_options_page(
        'Abo SDK',
        'Abo SDK',
        'manage_options',
        'abo-sdk',
        'abo_sdk_settings_page'
    );
}

function abo_sdk_settings_page() {
    ?>
    <div class="wrap">
        <h1>Abo SDK</h1>
        <div class="card" style="max-width:600px;padding:20px;margin-top:20px;">
            <h2>Configuration</h2>
            <table class="form-table">
                <tr>
                    <th>Clé API</th>
                    <td><code><?php echo esc_html(ABO_API_KEY); ?></code></td>
                </tr>
                <tr>
                    <th>Endpoint</th>
                    <td><code><?php echo esc_html(ABO_ENDPOINT); ?></code></td>
                </tr>
                <tr>
                    <th>Statut</th>
                    <td><span style="color:green;font-weight:bold;">Actif</span></td>
                </tr>
            </table>
            <p class="description" style="margin-top:15px;">
                Le SDK est automatiquement injecté sur toutes les pages de ton site.
                Les utilisateurs connectés sont identifiés par leur email WordPress.
            </p>
            <p class="description">
                Pour modifier la clé API, retélécharge le plugin depuis ton dashboard Abo
                (Intégrations → Télécharger le plugin WordPress).
            </p>
        </div>
    </div>
    <?php
}
?>
`;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get or generate API key
  const { data } = await supabase
    .from('user')
    .select('sdk_api_key')
    .eq('id', user.id)
    .single();

  let apiKey = data?.sdk_api_key;

  if (!apiKey) {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
    const { randomBytes } = await import('crypto');
    apiKey = `abo_sk_${randomBytes(32).toString('hex')}`;
    await admin.from('user').update({ sdk_api_key: apiKey }).eq('id', user.id);
  }

  const endpoint = `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'https://abo-six.vercel.app'}/api/sdk/events`;

  // Generate ZIP
  const zip = new JSZip();
  const folder = zip.folder('abo-sdk');
  folder!.file('abo-sdk.php', generatePluginPhp(apiKey, endpoint));

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="abo-sdk.zip"',
    },
  });
}
