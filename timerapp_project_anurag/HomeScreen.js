
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = ({ navigation }) => {
  const [timers, setTimers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTimer, setNewTimer] = useState({ name: '', duration: '', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadTimers();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadTimers = async () => {
    const savedTimers = await AsyncStorage.getItem('timers');
    if (savedTimers) setTimers(JSON.parse(savedTimers));
  };

  const saveTimer = async () => {
    if (!newTimer.name || !newTimer.duration || !newTimer.category) {
      Alert.alert('Error', 'fill all fields');
      return;
    }

    const updatedTimers = [
      ...timers,
      {
        ...newTimer,
        id: Date.now(),
        status: 'paused',
        remaining: parseInt(newTimer.duration, 10),
      },
    ];
    setTimers(updatedTimers);
    await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
    setModalVisible(false);
    setNewTimer({ name: '', duration: '', category: '' });
  };

  const deleteTimer = async (id) => {
    const updatedTimers = timers.filter((timer) => timer.id !== id);
    setTimers(updatedTimers);
    await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
  };

  const clearAllTimers = async () => {
    setTimers([]);
    await AsyncStorage.removeItem('timers');
  };

  const startTimer = (id) => {
    const updatedTimers = timers.map((timer) =>
      timer.id === id ? { ...timer, status: 'running' } : timer
    );
    setTimers(updatedTimers);
  };

  const pauseTimer = (id) => {
    const updatedTimers = timers.map((timer) =>
      timer.id === id ? { ...timer, status: 'paused' } : timer
    );
    setTimers(updatedTimers);
  };

  const resetTimer = (id) => {
    const updatedTimers = timers.map((timer) =>
      timer.id === id
        ? { ...timer, remaining: parseInt(timer.duration, 10), status: 'paused' }
        : timer
    );
    setTimers(updatedTimers);
  };

  // Timer countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.status === 'running' && timer.remaining > 0) {
            return { ...timer, remaining: timer.remaining - 1 };
          } else if (timer.status === 'running' && timer.remaining === 0) {
            Alert.alert('Timer Completed', `${timer.name} has finished!`);
            return { ...timer, status: 'completed' };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  // Group timers by category
  const groupTimersByCategory = () => {
    const grouped = {};
    timers.forEach((timer) => {
      if (!grouped[timer.category]) grouped[timer.category] = [];
      grouped[timer.category].push(timer);
    });
    return grouped;
  };

  // Get unique categories for the filter dropdown
  const getCategories = () => {
    const categories = new Set(timers.map((timer) => timer.category));
    return ['All', ...categories];
  };

  // Filter timers based on the selected category
  const filterTimersByCategory = (groupedTimers) => {
    if (selectedCategory === 'All') return groupedTimers;
    return { [selectedCategory]: groupedTimers[selectedCategory] || [] };
  };

  // Bulk actions
  const startAllTimers = (category) => {
    const updatedTimers = timers.map((timer) =>
      timer.category === category ? { ...timer, status: 'running' } : timer
    );
    setTimers(updatedTimers);
  };

  const pauseAllTimers = (category) => {
    const updatedTimers = timers.map((timer) =>
      timer.category === category ? { ...timer, status: 'paused' } : timer
    );
    setTimers(updatedTimers);
  };

  const resetAllTimers = (category) => {
    const updatedTimers = timers.map((timer) =>
      timer.category === category
        ? { ...timer, remaining: parseInt(timer.duration, 10), status: 'paused' }
        : timer
    );
    setTimers(updatedTimers);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Add Timer Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Clear All Timers Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearAllTimers}>
        <Text style={styles.clearButtonText}>Clear All Timers</Text>
      </TouchableOpacity>

      {/* Category Filter Dropdown */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          >
            {getCategories().map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Timer List */}
      <ScrollView>
        {Object.entries(filterTimersByCategory(groupTimersByCategory())).map(
          ([category, timers]) => (
            <View key={category} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryText}>{category}</Text>
                <View style={styles.bulkActions}>
                  <TouchableOpacity onPress={() => startAllTimers(category)}>
                    <Icon name="play-circle" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => pauseAllTimers(category)}>
                    <Icon name="pause-circle" size={24} color="#FFC107" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => resetAllTimers(category)}>
                    <Icon name="replay" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              {timers.map((timer) => (
                <View key={timer.id} style={styles.timerItem}>
                  <Text style={styles.timerName}>{timer.name}</Text>
                  <Text style={styles.timerTime}>{timer.remaining}s</Text>
                  <View style={styles.timerActions}>
                    <TouchableOpacity onPress={() => startTimer(timer.id)}>
                      <Icon name="play-arrow" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pauseTimer(timer.id)}>
                      <Icon name="pause" size={24} color="#FFC107" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => resetTimer(timer.id)}>
                      <Icon name="replay" size={24} color="#F44336" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTimer(timer.id)}>
                      <Icon name="delete" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Add Timer Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add New Timer</Text>
          <TextInput
            placeholder="Name"
            value={newTimer.name}
            onChangeText={(text) => setNewTimer({ ...newTimer, name: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Duration (seconds)"
            value={newTimer.duration}
            onChangeText={(text) => setNewTimer({ ...newTimer, duration: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Category"
            value={newTimer.category}
            onChangeText={(text) => setNewTimer({ ...newTimer, category: text })}
            style={styles.input}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={saveTimer}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200EE',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 1,
  },
  clearButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButtonText: { color: '#fff', fontWeight: 'bold' },
  filterContainer: { marginVertical: 16 },
  filterLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, elevation: 3 },
  picker: { height: 50, width: '100%' },
  categoryContainer: { marginBottom: 16 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  categoryText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  bulkActions: { flexDirection: 'row', gap: 16 },
  timerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    elevation: 3,
  },
  timerName: { fontSize: 16, fontWeight: '500', color: '#333' },
  timerTime: { fontSize: 16, color: '#666' },
  timerActions: { flexDirection: 'row', gap: 16 },
  modal: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f5f5f5' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  saveButton: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

export default HomeScreen;