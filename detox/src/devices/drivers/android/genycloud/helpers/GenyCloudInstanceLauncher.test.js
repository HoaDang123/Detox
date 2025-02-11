describe('Genymotion-Cloud instance launcher', () => {
  const anInstance = () => {
    const instance = new GenyInstance();
    instance.uuid = 'mock-instance-uuid';
    instance.name = 'mock-instance-name';
    return instance;
  }

  const givenAnInstanceDeletionError = () => instanceLifecycleService.deleteInstance.mockRejectedValue(new Error());

  let eventEmitter;
  let deviceCleanupRegistry;
  let instanceLifecycleService;
  let GenyInstance;
  let uut;
  beforeEach(() => {
    const AsyncEmitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const InstanceLifecycleService = jest.genMockFromModule('../services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    const DeviceRegistry = jest.genMockFromModule('../../../../../devices/DeviceRegistry');
    deviceCleanupRegistry = new DeviceRegistry();

    GenyInstance = jest.genMockFromModule('../services/dto/GenyInstance');

    const GenyCloudInstanceLauncher = require('./GenyCloudInstanceLauncher');
    uut = new GenyCloudInstanceLauncher(instanceLifecycleService, deviceCleanupRegistry, eventEmitter);
  });

  describe('Launch', () => {
    it('should register device in cleanup registry', async () => {
      const instance = anInstance();

      await uut.launch(instance);
      expect(deviceCleanupRegistry.allocateDevice).toHaveBeenCalledWith({
        uuid: instance.uuid,
        name: instance.name,
      })
    });
  });

  describe('Shutdown', () => {
    it('should delete the associated instance', async () => {
      const instance = anInstance();
      await uut.shutdown(instance);
      expect(instanceLifecycleService.deleteInstance).toHaveBeenCalledWith(instance.uuid);
    });

    it('should fail if deletion fails', async () => {
      givenAnInstanceDeletionError();

      try {
        const instance = anInstance();
        await uut.shutdown(instance);
        fail('Expected an error');
      } catch (e) {}
    });

    it('should remove the instance from the cleanup registry', async () => {
      const instance = anInstance();
      await uut.shutdown(instance);
      expect(deviceCleanupRegistry.disposeDevice).toHaveBeenCalledWith(expect.objectContaining({
        uuid: instance.uuid,
      }));
    });

    it('should emit associated events', async () => {
      const instance = anInstance();
      await uut.shutdown(instance);

      expect(eventEmitter.emit).toHaveBeenCalledWith('beforeShutdownDevice', { deviceId: instance.adbName });
      expect(eventEmitter.emit).toHaveBeenCalledWith('shutdownDevice', { deviceId: instance.adbName });
    });

    it('should not emit shutdownDevice prematurely', async () => {
      givenAnInstanceDeletionError();

      try {
        const instance = anInstance();
        await uut.shutdown(instance);
        fail('Expected an error');
      } catch (e) {}

      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).not.toHaveBeenCalledWith('shutdownDevice', expect.any(Object));
    });
  });
});
