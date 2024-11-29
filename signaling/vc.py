class VectorClock:
    def __init__(self, id):
        self.id = id
        self.clock = {id: 0}

    def increment(self):
        self.clock[self.id] += 1

    def update(self, other):
        for key in other.clock:
            if key not in self.clock:
                self.clock[key] = other.clock[key]
            else:
                self.clock[key] = max(self.clock[key], other.clock[key])

    def __str__(self):
        return str(self.clock)

    def __lt__(self, other):
        for key in self.clock:
            if key not in other.clock:
                return False
            if self.clock[key] > other.clock[key]:
                return False
        return True

    def __eq__(self, other):
        return self.clock == other.clock

    def __ne__(self, other):
        return self.clock != other.clock

    def __le__(self, other):
        return self < other or self == other

    def __gt__(self, other):
        return not self <= other

    def __ge__(self, other):
        return not self < other
