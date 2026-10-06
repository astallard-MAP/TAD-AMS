const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function updateLabels() {
    const projectId = 'c4h-wesbite';
    const secrets = ['GBP_CLIENT_ID', 'GBP_CLIENT_SECRET'];
    
    for (const secret of secrets) {
        const name = `projects/${projectId}/secrets/${secret}`;
        try {
            const [secretData] = await client.getSecret({ name });
            secretData.labels = secretData.labels || {};
            secretData.labels['firebase-managed'] = 'functions';
            
            await client.updateSecret({
                secret: secretData,
                updateMask: { paths: ['labels'] }
            });
            console.log(`Successfully labeled ${secret}`);
        } catch (err) {
            console.error(`Error updating ${secret}:`, err);
        }
    }
}
updateLabels();
