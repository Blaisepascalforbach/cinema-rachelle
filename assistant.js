/**
 * CECI EST UNE FONCTION SERVEUR (SERVERLESS FUNCTION)
 * Ce code ne s'exécute PAS dans le navigateur de l'élève, mais sur un serveur sécurisé.
 * Son rôle est d'agir comme un intermédiaire (proxy) pour protéger la clé API.
 * Pour le faire fonctionner, il faut déployer le projet sur un hébergeur comme Vercel ou Netlify.
 */

export default async function handler(req, res) {
    // On s'assure que la requête est bien de type POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { question, language } = req.body;

    // La clé API est récupérée depuis les variables d'environnement du serveur.
    // Elle n'est JAMAIS visible côté client.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: 'API key is not configured on the server.' });
    }

    // Le "system prompt" est défini ici, sur le serveur, pour plus de sécurité.
    const systemPrompt = `Tu es un assistant pédagogique pour des élèves allophones (niveau A2) qui apprennent à résoudre une équation du premier degré.
    Le problème est le suivant: "Rachelle a un budget de 80€. Un ticket de cinéma coûte 6€. Elle achète 4 paquets de popcorn à 8€ pièce. Le coût du popcorn est donc de 32€. L'équation pour trouver le nombre de tickets (x) est 6x + 32 = 80".
    Ton rôle est d'aider l'élève SANS donner la réponse finale.
    - Réponds TOUJOURS en français simple d'abord. Ta réponse en français doit être complète et pédagogique.
    - Explique les concepts (budget, inconnue, équation, multiplication, opération inverse, etc.) de manière simple.
    - Si l'élève est bloqué, guide-le en lui posant une question pour l'aider à réfléchir.
    - Après ta réponse en français, ajoute un séparateur '---'.
    - Ensuite, traduis ta réponse française dans la langue suivante : ${language}.
    - Ta réponse finale DOIT respecter ce format : [Réponse en français]\n---\n[Traduction dans la langue cible]`;

    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const googleResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: question }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            })
        });

        if (!googleResponse.ok) {
            console.error('Google API Error:', await googleResponse.text());
            throw new Error(`Google API responded with status ${googleResponse.status}`);
        }

        const result = await googleResponse.json();
        
        // On renvoie la réponse de Google au navigateur de l'élève.
        res.status(200).json(result);

    } catch (error) {
        console.error("Error in serverless function:", error);
        res.status(500).json({ message: "An error occurred while contacting the AI assistant." });
    }
}

