export default {
  name: 'example',
  description: 'Sample plugin — asks Laura to introduce herself in agent mode.',
  async run({ callBridge, print }) {
    print('Asking Laura to introduce herself in agent mode…');
    try {
      const reply = await callBridge('Présente-toi en une phrase.', {
        mode: 'agent',
        context: { activity: 'plugin demo' },
      });
      print(reply?.message?.content || '(no response)');
    } catch (error) {
      print(`Plugin bridge call failed: ${error.message}`);
    }
  },
};
