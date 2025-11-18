package com.cdmga.uestc.webpage.Service;

import com.cdmga.uestc.webpage.Entity.Activity;
import com.cdmga.uestc.webpage.Repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    public List<Activity> findAll() {
        return activityRepository.findAll();
    }

    public Optional<Activity> findById(Integer id) {
        return activityRepository.findById(id);
    }

    public Activity save(Activity activity) {
        return activityRepository.save(activity);
    }

    public void deleteById(Integer id) {
        activityRepository.deleteById(id);
    }

    public List<Activity> getAllActivitiesByPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityRepository.findAll(pageable).getContent();
    }

    public long countActivities() {
        return activityRepository.count();
    }
}