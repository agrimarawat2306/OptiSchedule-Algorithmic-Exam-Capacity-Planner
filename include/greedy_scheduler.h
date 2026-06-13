#ifndef GREEDY_SCHEDULER_H
#define GREEDY_SCHEDULER_H

#include <vector>
#include "../include/department.h"
#include "../include/seats.h"
#include "../include/display.h"

class Scheduler {
public:
static std::vector<Assignment> generateSchedule(std::vector<Dept>& departments, 
                    Seats& collegeCapacity, int numShifts, double examLength, int examGap);
};

#endif